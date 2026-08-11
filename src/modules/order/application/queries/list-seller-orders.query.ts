import { Injectable } from '@nestjs/common';
import { CatalogQueryService } from '@/modules/catalog/application/queries';
import { mapSellerOrderSummary } from '../../mappers/seller-orders.mapper';
import { OrderRepository } from '../../repositories/order.repository';
import {
  collectProductIdsFromOrders,
  loadProductSummaries,
} from '../utils/load-product-summaries';
import type { SellerOrdersFilterParams } from './query.params';

@Injectable()
export class ListSellerOrdersQuery {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogQueryService: CatalogQueryService,
  ) {}

  async execute(
    shopId: string,
    filters: SellerOrdersFilterParams,
    lang: string,
  ) {
    const result = await this.orderRepository.getSellerOrdersPaginated({
      shopId,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      sortBy: filters.sortBy ?? 'createdAt',
      sortOrder: filters.sortOrder ?? 'desc',
      orderStatus: filters.orderStatus,
      paymentStatus: filters.paymentStatus,
      search: filters.search,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      lang,
    });

    const productSummaries = await loadProductSummaries(
      this.catalogQueryService,
      collectProductIdsFromOrders(result.orders),
      lang,
    );

    return {
      orders: result.orders.map((order) =>
        mapSellerOrderSummary(order, lang, productSummaries),
      ),
      total: result.total,
    };
  }
}
