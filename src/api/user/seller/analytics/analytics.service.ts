import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, ne, sql } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  orderItemsTable,
  ordersTable,
  productsTable,
} from '@/_db/drizzle/schema';
import { OrderStatusEnum } from '@/_db/drizzle/enum';
import { ShopFollowRepository } from '@/modules/shop/repositories';
import { ShopCampaignRepository } from '@/_repositories/business/shop-campaign.repository/shop-campaign.repository';
import { ContentQueryService } from '@/modules/content/application/queries/content.query';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import type { TProductTranslation } from '@/_db/drizzle/schema';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopFollowRepository: ShopFollowRepository,
    private readonly shopCampaignRepository: ShopCampaignRepository,
    private readonly contentQueryService: ContentQueryService,
  ) {}

  async getOverview(shopId: string, lang: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [
      orderMetrics,
      topProductRows,
      followerCount,
      [campaignCountRow],
      [articleCountRow],
    ] = await Promise.all([
      this.getOrdersLast30Days(shopId, since),
      this.getTopProducts(shopId, since),
      this.shopFollowRepository.countByShopId(shopId),
      this.shopCampaignRepository.countApprovedByShopId(shopId),
      this.contentQueryService.countApprovedByShopId(shopId),
    ]);

    const productIds = topProductRows.map((row) => row.productId);
    const products =
      productIds.length > 0
        ? await this.db.client.query.productsTable.findMany({
            where: inArray(productsTable.id, productIds),
            with: { translations: true, thumbnail: true },
          })
        : [];
    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    const topProducts = topProductRows.map((row) => {
      const product = productMap.get(row.productId);
      const translation = resolveTranslation<TProductTranslation>(
        product?.translations,
        lang,
      );

      return {
        productId: row.productId,
        name: translation?.name ?? row.productName,
        slug: product?.slug ?? null,
        unitsSold: row.unitsSold,
        revenue: parseFloat(row.revenue ?? '0').toFixed(2),
        thumbnail: product?.thumbnail
          ? { id: product.thumbnail.id, url: product.thumbnail.url }
          : null,
      };
    });

    return {
      ordersLast30Days: orderMetrics,
      topProducts,
      followerCount,
      publishedCampaignsCount: campaignCountRow?.total ?? 0,
      publishedArticlesCount: articleCountRow?.total ?? 0,
    };
  }

  private async getOrdersLast30Days(shopId: string, since: Date) {
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

  private async getTopProducts(shopId: string, since: Date) {
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
