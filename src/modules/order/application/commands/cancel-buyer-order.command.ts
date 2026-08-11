import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { OrderStatusEnum } from '@/_db/drizzle/enum/order-status.enum';
import {
  NotificationEventNames,
  OrderStatusChangedEvent,
} from '@/common/modules/events/events';
import { InventoryCommandService } from '@/modules/inventory/application/commands/inventory.command';
import { OrderDomainError } from '../../domain/order.errors';
import { OrderRepository } from '../../repositories/order.repository';

@Injectable()
export class CancelBuyerOrderCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly orderRepository: OrderRepository,
    private readonly inventoryCommandService: InventoryCommandService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string, orderId: string, reason?: string) {
    const emitPayload = await this.db.transaction(async (tx) => {
      const order = await this.orderRepository.getOrderByIdAndUserId(
        orderId,
        userId,
        { tx, lock: true },
      );

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.isCancelledOrExpired()) {
        return null;
      }

      const previousStatus = order.status;

      try {
        order.cancelByBuyer(reason);
      } catch (error) {
        if (error instanceof OrderDomainError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }

      const orderItems =
        await this.orderRepository.getOrderItemsByOrderId(orderId);

      await this.orderRepository.save(order, { tx });

      await this.inventoryCommandService.releaseOrderReservation(
        orderItems.map((item) => ({
          variantId: item.variantId,
          shopId: order.shopId,
          quantity: item.quantity,
          productName: item.productName,
        })),
        orderId,
        userId,
        tx,
      );

      await this.orderRepository.createOrderStatusHistory(
        {
          orderId,
          fromStatus: previousStatus,
          toStatus: order.status,
          notes: reason ?? 'Cancelled by buyer',
          changedBy: userId,
        },
        { tx },
      );

      return {
        orderId,
        orderNumber: order.orderNumber,
        fromStatus: previousStatus,
        shopId: order.shopId,
        buyerUserId: order.userId,
        notes: reason ?? null,
      };
    });

    if (emitPayload) {
      this.eventEmitter.emit(
        NotificationEventNames.ORDER_STATUS_CHANGED,
        new OrderStatusChangedEvent({
          orderId: emitPayload.orderId,
          orderNumber: emitPayload.orderNumber,
          fromStatus: emitPayload.fromStatus,
          toStatus: OrderStatusEnum.CANCELLED,
          changedByUserId: userId,
          shopId: emitPayload.shopId,
          buyerUserId: emitPayload.buyerUserId,
          notes: emitPayload.notes,
        }),
      );
    }

    const order = await this.orderRepository.getOrderByIdAndUserId(
      orderId,
      userId,
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
