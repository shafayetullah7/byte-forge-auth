import { Injectable } from '@nestjs/common';
import { mapAdminOrderSummary } from '../../mappers/admin-orders.mapper';
import { OrderRepository } from '../../repositories/order.repository';
import type { AdminOrdersFilterParams } from './query.params';

@Injectable()
export class ListAdminOrdersQuery {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(query: AdminOrdersFilterParams, lang: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await this.orderRepository.getAdminOrdersPaginated({
      shopId: query.shopId,
      userId: query.userId,
      page,
      limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      orderStatus: query.orderStatus,
      paymentStatus: query.paymentStatus,
      search: query.search,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      lang,
    });

    return {
      data: result.orders.map((order) => mapAdminOrderSummary(order, lang)),
      meta: {
        page,
        limit,
        total: result.total,
      },
    };
  }
}
