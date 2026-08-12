import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { ShippingStatusEnum } from '@/_db/drizzle/enum/shipping-status.enum';
import {
  NotificationEventNames,
  OrderStatusChangedEvent,
} from '@/libs/modules/events/events';
import type { TAuthorizedShop } from '@/libs/types';
import { CatalogQueryService } from '@/modules/catalog/application/queries';
import { OrderStatus } from '../../domain/order-status';
import { OrderRepository } from '../../repositories/order.repository';
import { assertOrderNotStale } from '../assert-order-not-stale.util';
import type { UpdateSellerOrderStatusParams } from './command.params';
import {
  mapSellerOrderResponse,
  requireSellerOrderDetail,
  rethrowOrderDomainError,
} from './seller-order-command.helpers';

@Injectable()
export class UpdateSellerOrderStatusCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly orderRepository: OrderRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly catalogQueryService: CatalogQueryService,
  ) {}

  async execute(
    shop: TAuthorizedShop,
    orderId: string,
    sellerUserId: string,
    params: UpdateSellerOrderStatusParams,
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

      const previousStatus = order.status;

      try {
        order.updateStatusBySeller(params.status);
      } catch (error) {
        rethrowOrderDomainError(error);
      }

      await this.orderRepository.save(order, { tx });

      if (params.status === OrderStatus.DELIVERED) {
        const shipment =
          await this.orderRepository.getShipmentByOrderId(orderId);
        if (shipment) {
          await this.orderRepository.updateShipment(
            orderId,
            {
              deliveredAt: new Date(),
              status: ShippingStatusEnum.DELIVERED,
            },
            { tx },
          );
        }
      }

      const historyNotes = buildSellerStatusHistoryNotes(params);

      await this.orderRepository.createOrderStatusHistory(
        {
          orderId,
          fromStatus: previousStatus,
          toStatus: params.status,
          notes: historyNotes,
          changedBy: sellerUserId,
        },
        { tx },
      );

      const updated = requireSellerOrderDetail(
        await this.orderRepository.getSellerOrderDetail(orderId, shop.id),
        'Order not found after update',
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
          toStatus: params.status,
          changedByUserId: sellerUserId,
          shopId: shop.id,
          buyerUserId: order.userId,
          notes: historyNotes,
        },
      };
    });

    this.eventEmitter.emit(
      NotificationEventNames.ORDER_STATUS_CHANGED,
      new OrderStatusChangedEvent(emitPayload),
    );

    return result;
  }
}

function buildSellerStatusHistoryNotes(
  params: UpdateSellerOrderStatusParams,
): string {
  if (params.notes) {
    return params.notes;
  }

  switch (params.status) {
    case OrderStatus.PROCESSING:
      return 'Order accepted by seller';
    case OrderStatus.CONFIRMED:
      return 'Order packed and ready to ship';
    case OrderStatus.DELIVERED:
      return 'Order marked as delivered by seller';
    case OrderStatus.COMPLETED:
      return 'COD payment confirmed by seller';
    default:
      return `Status updated to ${params.status} by seller`;
  }
}
