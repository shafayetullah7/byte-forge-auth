import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogQueryService } from '@/modules/catalog/application/queries';
import { mapAdminOrderDetail } from '../../mappers/admin-orders.mapper';
import { OrderRepository } from '../../repositories/order.repository';
import { loadProductSummaries } from '../utils/load-product-summaries';

@Injectable()
export class GetAdminOrderQuery {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogQueryService: CatalogQueryService,
  ) {}

  async execute(orderId: string, lang: string) {
    const order = await this.orderRepository.getAdminOrderDetail(orderId, lang);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const productSummaries = await loadProductSummaries(
      this.catalogQueryService,
      order.items.map((item) => item.productId),
      lang,
    );

    return mapAdminOrderDetail(order, lang, productSummaries);
  }
}
