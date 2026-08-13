import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { mapOrderPaymentMethod } from '@/libs/utils/map-order-payment-method.util';
import type { TShopTranslation } from '@/_db/drizzle/schema';
import type { SellerOrderWithRelations } from '../repositories/order.repository.types';
import type { TShopStatus } from '@/_db/drizzle/enum/shop.status.enum';
import {
  productDisplayName,
  productImageUrl,
  type ProductSummaryMap,
} from './product-summary.util';
import {
  buildSellerActionDescriptors,
  buildSellerPaymentContext,
  isSellerOrderReadOnly,
} from './seller-order-actions.util';
import { mapStatusHistoryActor } from './map-status-history-actor.util';

export type MapSellerOrderContext = {
  shop: {
    id: string;
    status: TShopStatus;
    name?: string | null;
    ownerUserId?: string | null;
  };
  subscriptionFulfillmentAllowed?: boolean;
};

export function mapSellerOrder(
  order: SellerOrderWithRelations,
  lang: string,
  context?: MapSellerOrderContext,
  productSummaries?: ProductSummaryMap,
) {
  const customerName = order.user
    ? `${order.user.firstName} ${order.user.lastName}`.trim()
    : (order.address?.recipientName ?? 'Unknown Customer');
  const customerEmail = order.user?.localAuth?.email ?? null;
  const customerPhone = order.address?.phone ?? '';
  const buyerUserId = order.user?.id ?? null;
  const shopContext = context?.shop ?? {
    id: order.shopId,
    status: 'ACTIVE' as TShopStatus,
    name: null,
    ownerUserId: null,
  };

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
    customerName,
    customerEmail,
    customerPhone,
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
        shopContext.ownerUserId,
        shopContext.name ?? null,
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
    isReadOnly: isSellerOrderReadOnly(order.status),
    availableActions: buildSellerActionDescriptors({
      status: order.status,
      paymentMethod: order.paymentMethod,
      shipment: order.shipment,
      shopStatus: shopContext.status,
      subscriptionFulfillmentAllowed:
        context?.subscriptionFulfillmentAllowed ?? true,
    }),
    payment: buildSellerPaymentContext(order.paymentMethod, order.status),
    shop: {
      id: shopContext.id,
      status: shopContext.status,
    },
  };
}

export function mapSellerOrderSummary(
  order: SellerOrderWithRelations,
  lang: string,
  productSummaries?: ProductSummaryMap,
) {
  const mapped = mapSellerOrder(order, lang, undefined, productSummaries);
  return {
    id: mapped.id,
    orderNumber: mapped.orderNumber,
    status: mapped.status,
    paymentStatus: mapped.paymentStatus,
    paymentMethodKey: mapped.paymentMethodKey,
    paymentMethodDisplayName: mapped.paymentMethodDisplayName,
    total: mapped.total,
    createdAt: mapped.createdAt,
    customerName: mapped.customerName,
    customerEmail: mapped.customerEmail,
    items: mapped.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      variantTitle: item.variantTitle,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    })),
  };
}

export function buildMapSellerOrderContext(
  shop: {
    id: string;
    status: TShopStatus;
    ownerId: string;
    translations?: TShopTranslation[];
  },
  lang: string,
): MapSellerOrderContext {
  const translation = resolveTranslation<TShopTranslation>(
    shop.translations ?? [],
    lang,
  );

  return {
    shop: {
      id: shop.id,
      status: shop.status,
      name: translation?.name ?? null,
      ownerUserId: shop.ownerId,
    },
  };
}
