import type { TReview } from '@/_db/drizzle/schema/review/reviews.schema';
import type {
  TProductTranslation,
  TShopTranslation,
} from '@/_db/drizzle/schema';
import { OrderStatusEnum } from '@/_db/drizzle/enum';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { mapOrderPaymentMethod } from '@/common/utils/map-order-payment-method.util';
import type {
  BuyerOrderGroupOrderDetail,
  BuyerOrderGroupWithDetails,
} from '../repositories/order.repository.types';
import { mapStatusHistoryActor } from './map-status-history-actor.util';

export function mapBuyerOrderGroupDetail(
  group: BuyerOrderGroupWithDetails,
  lang: string,
  userId: string,
  reviewByOrderItem: Map<string, TReview>,
) {
  return {
    id: group.id,
    totalAmount: group.totalAmount,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    orders: group.orders.map((order) =>
      mapBuyerOrderGroupOrder(order, lang, userId, reviewByOrderItem),
    ),
  };
}

function mapBuyerOrderGroupOrder(
  order: BuyerOrderGroupOrderDetail,
  lang: string,
  userId: string,
  reviewByOrderItem: Map<string, TReview>,
) {
  const shopTranslation = resolveTranslation<TShopTranslation>(
    order.shop?.translations,
    lang,
  );
  const shopName = shopTranslation?.name ?? 'Unknown Shop';
  const shopLogo = order.shop?.logo?.url ?? null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    shopId: order.shopId,
    shopName,
    shopLogo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    ...mapOrderPaymentMethod(
      order.paymentMethod,
      order.paymentMethodId,
      order.paymentMethodCatalog,
    ),
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    total: order.total,
    notes: order.notes,
    cancelledAt: order.cancelledAt,
    cancelledReason: order.cancelledReason,
    buyerDeliveryConfirmedAt: order.buyerDeliveryConfirmedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    address: order.address
      ? {
          id: order.address.id,
          recipientName: order.address.recipientName,
          phone: order.address.phone,
          addressLine1: order.address.addressLine1,
          addressLine2: order.address.addressLine2,
          city: order.address.city,
          state: order.address.state,
          postalCode: order.address.postalCode,
          country: order.address.country,
          companyName: order.address.companyName,
          deliveryInstructions: order.address.deliveryInstructions,
        }
      : null,
    items: order.items.map((item) =>
      mapBuyerOrderGroupItem(item, lang, order.status, reviewByOrderItem),
    ),
    statusHistory: order.statusHistory.map((history) => {
      const { actor, actorLabel } = mapStatusHistoryActor(
        history,
        userId,
        order.shop?.ownerId ?? null,
        shopName,
      );
      return {
        id: history.id,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        notes: history.notes,
        createdAt: history.createdAt,
        actor,
        actorLabel,
      };
    }),
    shipment: order.shipment
      ? {
          id: order.shipment.id,
          trackingNumber: order.shipment.trackingNumber,
          carrier: order.shipment.carrier,
          shippingMethod: order.shipment.shippingMethod,
          status: order.shipment.status,
          shippedAt: order.shipment.shippedAt,
          deliveredAt: order.shipment.deliveredAt,
          estimatedDelivery: order.shipment.estimatedDelivery,
        }
      : null,
  };
}

function mapBuyerOrderGroupItem(
  item: BuyerOrderGroupOrderDetail['items'][number],
  lang: string,
  orderStatus: string,
  reviewByOrderItem: Map<string, TReview>,
) {
  const productTranslation = resolveTranslation<TProductTranslation>(
    item.product?.translations,
    lang,
  );
  const review = reviewByOrderItem.get(item.id);
  const isReviewableStatus =
    orderStatus === OrderStatusEnum.DELIVERED ||
    orderStatus === OrderStatusEnum.COMPLETED;

  return {
    id: item.id,
    productId: item.productId,
    productName: productTranslation?.name ?? item.productName,
    variantTitle: item.variantTitle,
    sku: item.sku,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
    thumbnail: item.product?.thumbnail
      ? { id: item.product.thumbnail.id, url: item.product.thumbnail.url }
      : null,
    canReview: isReviewableStatus && !review,
    reviewId: review?.id ?? null,
    reviewStatus: review?.status ?? null,
  };
}
