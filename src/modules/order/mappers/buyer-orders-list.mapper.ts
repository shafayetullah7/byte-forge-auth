import type { TShopTranslation } from '@/_db/drizzle/schema';
import type { TOrderItem } from '@/_db/drizzle/schema/order';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { mapOrderPaymentMethod } from '@/common/utils/map-order-payment-method.util';
import type { BuyerOrderWithRelations } from '../repositories/order.repository.types';
import type { TOrderGroup } from '@/_db/drizzle/schema/order';
import {
  productDisplayName,
  productThumbnail,
  type ProductSummaryMap,
} from './product-summary.util';

export function mapBuyerOrderGroupsList(
  groups: (TOrderGroup & { orders: BuyerOrderWithRelations[] })[],
  lang: string,
  productSummaries?: ProductSummaryMap,
) {
  return groups.map((group) => ({
    id: group.id,
    totalAmount: group.totalAmount,
    createdAt: group.createdAt,
    orders: group.orders.map((order) => {
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
        total: order.total,
        createdAt: order.createdAt,
        items: order.items.map((item: TOrderItem) => {
          return {
            id: item.id,
            productName: productDisplayName(item, productSummaries),
            variantTitle: item.variantTitle,
            quantity: item.quantity,
            total: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
            thumbnail: productThumbnail(item, productSummaries),
          };
        }),
      };
    }),
  }));
}
