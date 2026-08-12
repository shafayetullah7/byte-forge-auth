import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, ne, sql } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { orderItemsTable, ordersTable } from '@/_db/drizzle/schema';
import { OrderStatusEnum } from '@/_db/drizzle/enum';

@Injectable()
export class SellerAnalyticsRepository {
  constructor(private readonly db: DrizzleService) {}

  async getOrdersLast30Days(shopId: string, since: Date) {
    const [row] = await this.db.client
      .select({
        count: count(),
        revenue: sql<string>`COALESCE(SUM(CASE WHEN ${ordersTable.status} = ${OrderStatusEnum.COMPLETED} THEN ${ordersTable.total}::numeric ELSE 0 END), 0)`,
      })
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.shopId, shopId),
          gte(ordersTable.createdAt, since),
          ne(ordersTable.status, OrderStatusEnum.CANCELLED),
        ),
      );

    const revenue = parseFloat(row?.revenue ?? '0').toFixed(2);

    return {
      count: row?.count ?? 0,
      revenue,
    };
  }

  getTopProducts(shopId: string, since: Date) {
    return this.db.client
      .select({
        productId: orderItemsTable.productId,
        productName: orderItemsTable.productName,
        unitsSold: sql<number>`SUM(${orderItemsTable.quantity})::int`,
        revenue: sql<string>`COALESCE(SUM(${orderItemsTable.subtotal}::numeric), 0)`,
      })
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
      .where(
        and(
          eq(ordersTable.shopId, shopId),
          gte(ordersTable.createdAt, since),
          inArray(ordersTable.status, [
            OrderStatusEnum.COMPLETED,
            OrderStatusEnum.DELIVERED,
          ]),
        ),
      )
      .groupBy(orderItemsTable.productId, orderItemsTable.productName)
      .orderBy(desc(sql`SUM(${orderItemsTable.quantity})`))
      .limit(5);
  }
}
