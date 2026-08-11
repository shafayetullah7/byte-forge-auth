import { Injectable } from '@nestjs/common';
import {
  GetAdminOrderQuery,
  GetAdminOrderStatsQuery,
  ListAdminOrdersQuery,
} from '@/modules/order/application/queries';
import {
  AdminOrderStatsQueryDto,
  AdminOrdersQueryDto,
} from './dto/admin-orders-query.dto';

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly listAdminOrdersQuery: ListAdminOrdersQuery,
    private readonly getAdminOrderStatsQuery: GetAdminOrderStatsQuery,
    private readonly getAdminOrderQuery: GetAdminOrderQuery,
  ) {}

  listOrders(query: AdminOrdersQueryDto, lang: string) {
    return this.listAdminOrdersQuery.execute(
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        shopId: query.shopId,
        userId: query.userId,
        orderStatus: query.status,
        paymentStatus: query.paymentStatus,
        search: query.search,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      },
      lang,
    );
  }

  getOrderStats(query: AdminOrderStatsQueryDto) {
    return this.getAdminOrderStatsQuery.execute({
      shopId: query.shopId,
      userId: query.userId,
    });
  }

  getOrder(orderId: string, lang: string) {
    return this.getAdminOrderQuery.execute(orderId, lang);
  }
}
