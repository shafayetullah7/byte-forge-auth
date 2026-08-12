import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { OrderStatusEnum } from '@/_db/drizzle/enum/order-status.enum';
import {
  NotificationEventNames,
  OrderStatusChangedEvent,
} from '@/libs/modules/events/events';
import type { TAuthorizedShop } from '@/libs/types';
import { CatalogQueryService } from '@/modules/catalog/application/queries';
import { InventoryCommandService } from '@/modules/inventory/application/commands/inventory.command';
import { assertOrderNotStale } from '../assert-order-not-stale.util';
import { OrderRepository } from '../../repositories/order.repository';
import type { CancelSellerOrderParams } from './command.params';
import {
  mapSellerOrderResponse,
  requireSellerOrderDetail,
  rethrowOrderDomainError,
} from './seller-order-command.helpers';

@Injectable()
export class CancelSellerOrderCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly orderRepository: OrderRepository,
    private readonly inventoryCommandService: InventoryCommandService,
    private readonly eventEmitter: EventEmitter2,
    private readonly catalogQueryService: CatalogQueryService,
  ) {}

  async execute(
    shop: TAuthorizedShop,
    orderId: string,
    sellerUserId: string,
    params: CancelSellerOrderParams,
    lang: string,
  ) {
    const { result, emitPayload } = await this.db.transaction(async (tx) => {
      const order = await this.orderRepository.getOrderByIdAndShopId(
        orderId,
        shop.id,
        { tx, lock: true },
      );

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      assertOrderNotStale(order.updatedAt, params.expectedUpdatedAt);

      if (order.isCancelledOrExpired()) {
        const existing = requireSellerOrderDetail(
          await this.orderRepository.getSellerOrderDetail(orderId, shop.id),
          'Order not found',
        );
        return {
          result: await mapSellerOrderResponse(
            existing,
            shop,
            lang,
            this.catalogQueryService,
          ),
          emitPayload: null,
        };
      }

      const previousStatus = order.status;

      try {
        order.cancelBySeller(params.reason);
      } catch (error) {
        rethrowOrderDomainError(error);
      }

      const orderItems =
        await this.orderRepository.getOrderItemsByOrderId(orderId);

      await this.orderRepository.save(order, { tx });

      await this.inventoryCommandService.releaseOrderReservation(
        orderItems.map((item) => ({
          variantId: item.variantId,
          shopId: order.shopId,
          quantity: item.quantity,
        })),
        orderId,
        sellerUserId,
        tx,
      );

      await this.orderRepository.createOrderStatusHistory(
        {
          orderId,
          fromStatus: previousStatus,
          toStatus: order.status,
          notes: params.reason,
          changedBy: sellerUserId,
        },
        { tx },
      );

      const updated = requireSellerOrderDetail(
        await this.orderRepository.getSellerOrderDetail(orderId, shop.id),
        'Order not found after cancellation',
      );

      return {
        result: await mapSellerOrderResponse(
          updated,
          shop,
          lang,
          this.catalogQueryService,
        ),
        emitPayload: {
          orderId,
          orderNumber: order.orderNumber,
          fromStatus: previousStatus,
          toStatus: OrderStatusEnum.CANCELLED,
          changedByUserId: sellerUserId,
          shopId: shop.id,
          buyerUserId: order.userId,
          notes: params.reason,
        },
      };
    });

    if (emitPayload) {
      this.eventEmitter.emit(
        NotificationEventNames.ORDER_STATUS_CHANGED,
        new OrderStatusChangedEvent(emitPayload),
      );
    }

    return result;
  }
}
