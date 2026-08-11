import { Injectable, NotFoundException } from '@nestjs/common';
import type { TAuthorizedShop } from '@/common/types';
import { CatalogQueryService } from '@/modules/catalog/application/queries';
import {
  buildMapSellerOrderContext,
  mapSellerOrder,
} from '../../mappers/seller-orders.mapper';
import { OrderRepository } from '../../repositories/order.repository';
import { loadProductSummaries } from '../utils/load-product-summaries';

@Injectable()
export class GetSellerOrderQuery {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogQueryService: CatalogQueryService,
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

    return mapSellerOrder(
      order,
      lang,
      buildMapSellerOrderContext(shop, lang),
      productSummaries,
    );
  }
}
