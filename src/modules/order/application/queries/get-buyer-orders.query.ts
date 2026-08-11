import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../repositories/order.repository';
import { mapBuyerOrderGroupsList } from '../../mappers/buyer-orders-list.mapper';
import type { BuyerOrdersFilterParams } from './query.params';

@Injectable()
export class GetBuyerOrdersQuery {
  constructor(private readonly orderRepository: OrderRepository) {}

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

    return {
      groups: mapBuyerOrderGroupsList(result.groups, lang),
      total: result.total,
    };
  }
}
