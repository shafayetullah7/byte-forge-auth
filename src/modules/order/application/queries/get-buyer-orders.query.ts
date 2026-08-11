import { Injectable } from '@nestjs/common';
import { CatalogQueryService } from '@/modules/catalog/application/queries';
import { OrderRepository } from '../../repositories/order.repository';
import { mapBuyerOrderGroupsList } from '../../mappers/buyer-orders-list.mapper';
import {
  collectProductIdsFromOrders,
  loadProductSummaries,
} from '../utils/load-product-summaries';
import type { BuyerOrdersFilterParams } from './query.params';

@Injectable()
export class GetBuyerOrdersQuery {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogQueryService: CatalogQueryService,
  ) {}

  async execute(
    userId: string,
    filters: BuyerOrdersFilterParams,
    lang: string = 'en',
  ) {
    const result = await this.orderRepository.getBuyerOrderGroupsPaginated({
      userId,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      sortBy: filters.sortBy ?? 'createdAt',
      sortOrder: filters.sortOrder ?? 'desc',
      orderStatus: filters.orderStatus,
      paymentStatus: filters.paymentStatus,
      search: filters.search,
      lang,
    });

    const productSummaries = await loadProductSummaries(
      this.catalogQueryService,
      result.groups.flatMap((group) =>
        collectProductIdsFromOrders(group.orders),
      ),
      lang,
    );

    return {
      groups: mapBuyerOrderGroupsList(result.groups, lang, productSummaries),
      total: result.total,
    };
  }
}
