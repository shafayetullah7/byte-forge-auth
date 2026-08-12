import { Injectable } from '@nestjs/common';
import { UserQueryService } from '@/modules/user/application/queries/user.query';
import { mapAdminOrderSummary } from '../../mappers/admin-orders.mapper';
import { OrderRepository } from '../../repositories/order.repository';
import {
  collectUserIdsFromOrders,
  loadUserSummaries,
} from '../utils/load-user-summaries';
import type { AdminOrdersFilterParams } from './query.params';

/**
 * Admin order list. Buyer display fields use `UserQueryService`; shop names stay
 * on the order repository join until shop query cutover is complete.
 */
@Injectable()
export class ListAdminOrdersQuery {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly userQueryService: UserQueryService,
  ) {}

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

    const userSummaries = await loadUserSummaries(
      this.userQueryService,
      collectUserIdsFromOrders(result.orders),
    );

    return {
      data: result.orders.map((order) =>
        mapAdminOrderSummary(order, lang, userSummaries),
      ),
      meta: {
        page,
        limit,
        total: result.total,
      },
    };
  }
}
