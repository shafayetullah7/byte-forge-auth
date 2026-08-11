import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { mapOrderPaymentMethod } from '@/common/utils/map-order-payment-method.util';
import type { TShopTranslation } from '@/_db/drizzle/schema';
import type { AdminOrderWithRelations } from '../repositories/order.repository.types';
import { mapStatusHistoryActor } from './map-status-history-actor.util';
import {
  productDisplayName,
  productImageUrl,
  type ProductSummaryMap,
} from './product-summary.util';

function mapShop(order: AdminOrderWithRelations, lang: string) {
  const translation = resolveTranslation<TShopTranslation>(
    order.shop?.translations ?? [],
    lang,
  );

  return {
    id: order.shopId,
    slug: order.shop?.slug ?? null,
    name: translation?.name ?? null,
    status: order.shop?.status ?? null,
  };
}

function mapBuyer(order: AdminOrderWithRelations) {
  if (!order.user) {
    return {
      id: order.userId,
      name: order.address?.recipientName ?? 'Unknown customer',
      email: null as string | null,
      phone: order.address?.phone ?? null,
      userName: null as string | null,
    };
  }

  return {
    id: order.user.id,
    name: `${order.user.firstName} ${order.user.lastName}`.trim(),
    email: order.user.localAuth?.email ?? null,
    phone: order.address?.phone ?? null,
    userName: order.user.userName,
  };
}

export function mapAdminOrderSummary(
  order: AdminOrderWithRelations,
  lang: string,
) {
  const buyer = mapBuyer(order);
  const shop = mapShop(order, lang);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    ...mapOrderPaymentMethod(
      order.paymentMethod,
      order.paymentMethodId,
      order.paymentMethodCatalog,
    ),
    total: order.total,
    createdAt: order.createdAt,
    shop,
    buyer,
    itemCount: order.items.length,
  };
}

export function mapAdminOrderDetail(
  order: AdminOrderWithRelations,
  lang: string,
  productSummaries?: ProductSummaryMap,
) {
  const buyer = mapBuyer(order);
  const shop = mapShop(order, lang);
  const buyerUserId = order.user?.id ?? null;
  const shopOwnerUserId = order.shop?.ownerId ?? null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    groupId: order.groupId,
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
    shop,
    buyer,
    address: order.address
      ? {
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
    items: order.items.map((item) => {
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: productDisplayName(item, productSummaries),
        variantTitle: item.variantTitle,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        imageUrl: productImageUrl(item, productSummaries),
      };
    }),
    statusHistory: order.statusHistory.map((history) => {
      const { actor, actorLabel } = mapStatusHistoryActor(
        history,
        buyerUserId,
        shopOwnerUserId,
        shop.name,
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
