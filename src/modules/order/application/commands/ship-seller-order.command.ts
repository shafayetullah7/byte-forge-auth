import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from 'nestjs-i18n';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { OrderStatusEnum } from '@/_db/drizzle/enum/order-status.enum';
import { ShippingStatusEnum } from '@/_db/drizzle/enum/shipping-status.enum';
import {
  NotificationEventNames,
  OrderStatusChangedEvent,
} from '@/libs/modules/events/events';
import type { TAuthorizedShop } from '@/libs/types';
import { CatalogQueryService } from '@/modules/catalog/application/queries';
import { InventoryCommandService } from '@/modules/inventory/application/commands/inventory.command';
import { CheckSellerSubscriptionQuery } from '@/modules/subscription/application/queries/check-seller-subscription.query';
import { OrderStatus } from '../../domain/order-status';
import { OrderRepository } from '../../repositories/order.repository';
import { assertOrderNotStale } from '../assert-order-not-stale.util';
import type { ShipSellerOrderParams } from './command.params';
import {
  assertSellerSubscriptionAllowsFulfillment,
  mapSellerOrderResponse,
  requireSellerOrderDetail,
  rethrowOrderDomainError,
} from './seller-order-command.helpers';

@Injectable()
export class ShipSellerOrderCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly orderRepository: OrderRepository,
    private readonly inventoryCommandService: InventoryCommandService,
    private readonly eventEmitter: EventEmitter2,
    private readonly catalogQueryService: CatalogQueryService,
    private readonly checkSellerSubscription: CheckSellerSubscriptionQuery,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    shop: TAuthorizedShop,
    orderId: string,
    sellerUserId: string,
    params: ShipSellerOrderParams,
    lang: string,
  ) {
    await assertSellerSubscriptionAllowsFulfillment(
      this.checkSellerSubscription,
      shop.id,
      lang,
      this.i18n,
    );

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

      if (order.status === OrderStatus.SHIPPED) {
        const existingShipment =
          await this.orderRepository.getShipmentByOrderId(orderId);
        if (existingShipment) {
          throw new BadRequestException('Order has already been shipped');
        }
      }

      const existingShipment =
        await this.orderRepository.getShipmentByOrderId(orderId);
      if (existingShipment) {
        throw new BadRequestException('Shipment already exists for this order');
      }

      try {
        order.prepareForShipment();
      } catch (error) {
        rethrowOrderDomainError(error);
      }

      const orderItems =
        await this.orderRepository.getOrderItemsByOrderId(orderId);

      const previousStatus = order.status;
      const shippedAt = new Date();
      const shippingMethod = params.shippingMethod ?? 'COURIER';
      const shipmentStatus =
        shippingMethod === 'COURIER'
          ? ShippingStatusEnum.IN_TRANSIT
          : ShippingStatusEnum.PENDING;

      const shipNotes =
        params.notes?.trim() ||
        (shippingMethod === 'COURIER'
          ? `Shipped via ${params.carrier} (${params.trackingNumber})`
          : shippingMethod === 'SELF_DELIVERY'
            ? 'Self delivery arranged by seller'
            : 'Customer pickup arranged');

      await this.orderRepository.createShipment(
        {
          orderId,
          carrier: params.carrier ?? null,
          trackingNumber: params.trackingNumber ?? null,
          shippingMethod,
          status: shipmentStatus,
          shippedAt,
          estimatedDelivery: params.estimatedDelivery
            ? new Date(params.estimatedDelivery)
            : null,
        },
        { tx },
      );

      order.markShipped();
      await this.orderRepository.save(order, { tx });

      await this.inventoryCommandService.fulfillOrder(
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
          toStatus: OrderStatusEnum.SHIPPED,
          notes: shipNotes,
          changedBy: sellerUserId,
        },
        { tx },
      );

      const updated = requireSellerOrderDetail(
        await this.orderRepository.getSellerOrderDetail(orderId, shop.id),
        'Order not found after shipping',
      );

      return {
        result: await mapSellerOrderResponse(
          updated,
          shop,
          lang,
          this.catalogQueryService,
          this.checkSellerSubscription,
        ),
        emitPayload: {
          orderId,
          orderNumber: order.orderNumber,
          fromStatus: previousStatus,
          toStatus: OrderStatusEnum.SHIPPED,
          changedByUserId: sellerUserId,
          shopId: shop.id,
          buyerUserId: order.userId,
          notes: shipNotes,
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
