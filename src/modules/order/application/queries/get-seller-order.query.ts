import { Injectable, NotFoundException } from '@nestjs/common';
import type { TAuthorizedShop } from '@/libs/types';
import { CatalogQueryService } from '@/modules/catalog/application/queries';
import { CheckSellerSubscriptionQuery } from '@/modules/subscription/application/queries/check-seller-subscription.query';
import {
  buildMapSellerOrderContext,
  mapSellerOrder,
} from '../../mappers/seller-orders.mapper';
import { OrderRepository } from '../../repositories/order.repository';
import { loadProductSummaries } from '../utils/load-product-summaries';
import { isSellerSubscriptionFulfillmentAllowed } from '../commands/seller-order-command.helpers';

@Injectable()
export class GetSellerOrderQuery {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogQueryService: CatalogQueryService,
    private readonly checkSellerSubscription: CheckSellerSubscriptionQuery,
  ) {}

  async execute(shop: TAuthorizedShop, orderId: string, lang: string) {
    const order = await this.orderRepository.getSellerOrderDetail(
      orderId,
      shop.id,
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const productSummaries = await loadProductSummaries(
      this.catalogQueryService,
      order.items.map((item) => item.productId),
      lang,
    );

    const context = buildMapSellerOrderContext(shop, lang);
    context.subscriptionFulfillmentAllowed =
      await isSellerSubscriptionFulfillmentAllowed(
        this.checkSellerSubscription,
        shop.id,
      );

    return mapSellerOrder(
      order,
      lang,
      context,
      productSummaries,
    );
  }
}
