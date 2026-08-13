import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { ordersTable, productsTable, reviewsTable } from '@/_db/drizzle/schema';
import { shopTable, shopTranslationsTable } from '@/_db/drizzle/schema/shop';
import {
  ShopStatusEnum,
  OrderStatusEnum,
  ReviewStatusEnum,
} from '@/_db/drizzle/enum';
import { paginate } from '@/libs/utils/pagination.util';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import type { ListPublicShopsQueryDto } from '../../controllers/dto/list-public-shops-query.dto';
import { CheckSellerSubscriptionQuery } from '@/modules/subscription/application/queries/check-seller-subscription.query';

export type PublicShopListItemDto = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  division: string | null;
  city: string | null;
  isVerified: boolean;
  status: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logo: { id: string; url: string } | null;
  banner: { id: string; url: string } | null;
  createdAt: string;
  metrics: {
    totalProducts: number;
    completedOrders: number;
    averageRating: number;
    reviewCount: number;
  };
};

@Injectable()
export class ListPublicShopsQuery {
  constructor(
    private readonly db: DrizzleService,
    private readonly checkSellerSubscription: CheckSellerSubscriptionQuery,
  ) {}

  async execute(query: ListPublicShopsQueryDto, lang: string = 'en') {
    const { page, limit, search, sort } = query;
    const offset = (page - 1) * limit;

    const visibility = eq(shopTable.status, ShopStatusEnum.ACTIVE);

    const searchFilter = search?.trim()
      ? or(
          ilike(shopTable.slug, `%${search.trim()}%`),
          sql`exists (
            select 1 from ${shopTranslationsTable}
            where ${shopTranslationsTable.shopId} = ${shopTable.id}
            and ${shopTranslationsTable.name} ilike ${`%${search.trim()}%`}
          )`,
        )
      : undefined;

    const where = and(
      visibility,
      searchFilter,
      this.checkSellerSubscription.shopHasActiveEntitlement(shopTable.id),
    );

    const orderBy =
      sort === 'newest'
        ? [desc(shopTable.createdAt)]
        : [desc(shopTable.createdAt)];

    const shops = await this.db.client.query.shopTable.findMany({
      where,
      orderBy,
      limit,
      offset,
      with: {
        translations: true,
        logo: true,
        banner: true,
        shopAddressTable: {
          with: { translations: true },
        },
      },
    });

    const [{ total }] = await this.db.client
      .select({ total: count() })
      .from(shopTable)
      .where(where);

    const shopIds = shops.map((s) => s.id);

    const [productCounts, orderCounts, reviewStats] = shopIds.length
      ? await Promise.all([
          this.db.client
            .select({
              shopId: productsTable.shopId,
              value: count(),
            })
            .from(productsTable)
            .where(
              and(
                inArray(productsTable.shopId, shopIds),
                eq(productsTable.status, 'ACTIVE'),
                eq(productsTable.productType, 'plant'),
              ),
            )
            .groupBy(productsTable.shopId),
          this.db.client
            .select({
              shopId: ordersTable.shopId,
              value: count(),
            })
            .from(ordersTable)
            .where(
              and(
                inArray(ordersTable.shopId, shopIds),
                eq(ordersTable.status, OrderStatusEnum.COMPLETED),
              ),
            )
            .groupBy(ordersTable.shopId),
          this.db.client
            .select({
              shopId: productsTable.shopId,
              avg: sql<string>`coalesce(avg(${reviewsTable.rating}), 0)`,
              cnt: count(),
            })
            .from(reviewsTable)
            .innerJoin(
              productsTable,
              eq(productsTable.id, reviewsTable.productId),
            )
            .where(
              and(
                inArray(productsTable.shopId, shopIds),
                eq(reviewsTable.status, ReviewStatusEnum.APPROVED),
                eq(reviewsTable.isRemovedByAdmin, false),
              ),
            )
            .groupBy(productsTable.shopId),
        ])
      : [[], [], []];

    const productCountMap = new Map(
      productCounts.map((r) => [r.shopId, Number(r.value)]),
    );
    const orderCountMap = new Map(
      orderCounts.map((r) => [r.shopId, Number(r.value)]),
    );
    const reviewMap = new Map(
      reviewStats.map((r) => [
        r.shopId,
        { avg: Number(r.avg), cnt: Number(r.cnt) },
      ]),
    );

    let data: PublicShopListItemDto[] = shops.map((shop) => {
      const translation = resolveTranslation(shop.translations, lang);
      const addressTranslation = shop.shopAddressTable
        ? resolveTranslation(shop.shopAddressTable.translations ?? [], lang)
        : null;
      const reviews = reviewMap.get(shop.id) ?? { avg: 0, cnt: 0 };

      return {
        id: shop.id,
        slug: shop.slug,
        name: translation?.name ?? shop.slug,
        tagline: translation?.tagline ?? null,
        description: translation?.description ?? null,
        division: addressTranslation?.division ?? null,
        city: addressTranslation?.district ?? null,
        isVerified: shop.isVerified,
        status: shop.status,
        primaryColor: shop.primaryColor,
        secondaryColor: shop.secondaryColor,
        accentColor: shop.accentColor,
        logo: shop.logo ? { id: shop.logo.id, url: shop.logo.url } : null,
        banner: shop.banner
          ? { id: shop.banner.id, url: shop.banner.url }
          : null,
        createdAt: shop.createdAt.toISOString(),
        metrics: {
          totalProducts: productCountMap.get(shop.id) ?? 0,
          completedOrders: orderCountMap.get(shop.id) ?? 0,
          averageRating: reviews.avg,
          reviewCount: reviews.cnt,
        },
      };
    });

    if (sort === 'rating') {
      data = [...data].sort(
        (a, b) => b.metrics.averageRating - a.metrics.averageRating,
      );
    } else if (sort === 'products') {
      data = [...data].sort(
        (a, b) => b.metrics.totalProducts - a.metrics.totalProducts,
      );
    } else if (sort === 'popular') {
      data = [...data].sort((a, b) => {
        const scoreA =
          a.metrics.completedOrders * 0.4 +
          a.metrics.averageRating * 0.3 +
          a.metrics.reviewCount * 0.1;
        const scoreB =
          b.metrics.completedOrders * 0.4 +
          b.metrics.averageRating * 0.3 +
          b.metrics.reviewCount * 0.1;
        return scoreB - scoreA;
      });
    }

    return paginate(data, total, page, limit);
  }

  async getShopMetrics(shopId: string) {
    const [productCount, orderCount, reviewStat] = await Promise.all([
      this.db.client
        .select({ value: count() })
        .from(productsTable)
        .where(
          and(
            eq(productsTable.shopId, shopId),
            eq(productsTable.status, 'ACTIVE'),
            eq(productsTable.productType, 'plant'),
          ),
        ),
      this.db.client
        .select({ value: count() })
        .from(ordersTable)
        .where(
          and(
            eq(ordersTable.shopId, shopId),
            eq(ordersTable.status, OrderStatusEnum.COMPLETED),
          ),
        ),
      this.db.client
        .select({
          avg: sql<string>`coalesce(avg(${reviewsTable.rating}), 0)`,
          cnt: count(),
        })
        .from(reviewsTable)
        .innerJoin(productsTable, eq(productsTable.id, reviewsTable.productId))
        .where(
          and(
            eq(productsTable.shopId, shopId),
            eq(reviewsTable.status, ReviewStatusEnum.APPROVED),
            eq(reviewsTable.isRemovedByAdmin, false),
          ),
        ),
    ]);

    return {
      totalProducts: Number(productCount[0]?.value ?? 0),
      completedOrders: Number(orderCount[0]?.value ?? 0),
      averageRating: Number(reviewStat[0]?.avg ?? 0),
      reviewCount: Number(reviewStat[0]?.cnt ?? 0),
    };
  }
}
