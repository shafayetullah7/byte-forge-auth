import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { OrderStatusEnum } from '@/_db/drizzle/enum/order-status.enum';
import { ShippingStatusEnum } from '@/_db/drizzle/enum/shipping-status.enum';
import {
  NotificationEventNames,
  OrderStatusChangedEvent,
} from '@/libs/modules/events/events';
import { OrderDomainError } from '../../domain/order.errors';
import { OrderRepository } from '../../repositories/order.repository';

@Injectable()
export class ConfirmDeliveryCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly orderRepository: OrderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string, orderId: string) {
    const emitPayload = await this.db.transaction(async (tx) => {
      const order = await this.orderRepository.getOrderByIdAndUserId(
        orderId,
        userId,
        { tx, lock: true },
      );

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const fromStatus = order.status;

      try {
        order.confirmDelivery();
      } catch (error) {
        if (error instanceof OrderDomainError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }

      await this.orderRepository.save(order, { tx });

      const shipment = await this.orderRepository.getShipmentByOrderId(orderId);
      if (shipment) {
        await this.orderRepository.updateShipment(
          orderId,
          {
            deliveredAt: order.buyerDeliveryConfirmedAt,
            status: ShippingStatusEnum.DELIVERED,
          },
          { tx },
        );
      }

      await this.orderRepository.createOrderStatusHistory(
        {
          orderId,
          fromStatus,
          toStatus: order.status,
          notes: 'Delivery confirmed by buyer',
          changedBy: userId,
        },
        { tx },
      );

      return {
        orderId,
        orderNumber: order.orderNumber,
        fromStatus,
        shopId: order.shopId,
        buyerUserId: order.userId,
      };
    });

    this.eventEmitter.emit(
      NotificationEventNames.ORDER_STATUS_CHANGED,
      new OrderStatusChangedEvent({
        orderId: emitPayload.orderId,
        orderNumber: emitPayload.orderNumber,
        fromStatus: emitPayload.fromStatus,
        toStatus: OrderStatusEnum.DELIVERED,
        changedByUserId: userId,
        shopId: emitPayload.shopId,
        buyerUserId: emitPayload.buyerUserId,
      }),
    );

    return { orderId: emitPayload.orderId, status: OrderStatusEnum.DELIVERED };
  }
}
