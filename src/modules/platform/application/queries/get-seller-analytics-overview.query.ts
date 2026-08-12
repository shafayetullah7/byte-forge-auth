import { Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productsTable } from '@/_db/drizzle/schema';
import type { TProductTranslation } from '@/_db/drizzle/schema';
import { ContentQueryService } from '@/modules/content/application/queries/content.query';
import { ShopFollowRepository } from '@/modules/shop/repositories';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { SellerAnalyticsRepository } from '../../repositories';

@Injectable()
export class GetSellerAnalyticsOverviewQuery {
  constructor(
    private readonly db: DrizzleService,
    private readonly sellerAnalyticsRepository: SellerAnalyticsRepository,
    private readonly shopFollowRepository: ShopFollowRepository,
    private readonly contentQueryService: ContentQueryService,
  ) {}

  async execute(shopId: string, lang: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [
      orderMetrics,
      topProductRows,
      followerCount,
      [campaignCountRow],
      [articleCountRow],
    ] = await Promise.all([
      this.sellerAnalyticsRepository.getOrdersLast30Days(shopId, since),
      this.sellerAnalyticsRepository.getTopProducts(shopId, since),
      this.shopFollowRepository.countByShopId(shopId),
      this.contentQueryService.countApprovedCampaignsByShopId(shopId),
      this.contentQueryService.countApprovedArticlesByShopId(shopId),
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
}
