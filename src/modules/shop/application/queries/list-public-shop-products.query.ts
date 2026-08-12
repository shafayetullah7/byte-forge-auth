import { Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  mediaTable,
  productTranslationsTable,
  productVariantsTable,
  productsTable,
  reviewsTable,
} from '@/_db/drizzle/schema';
import { shopTable } from '@/_db/drizzle/schema/shop';
import { ReviewStatusEnum, ShopStatusEnum } from '@/_db/drizzle/enum';
import { paginate } from '@/libs/utils/pagination.util';
import type { ListPublicShopProductsQueryDto } from '../../controllers/dto/list-public-shop-products-query.dto';

export type PublicShopProductDto = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  thumbnailUrl: string | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
  inStock: boolean;
  productType: string;
  isFeatured: boolean;
};

@Injectable()
export class ListPublicShopProductsQuery {
  constructor(private readonly db: DrizzleService) {}

  private async assertPublicShop(slug: string) {
    const shop = await this.db.client.query.shopTable.findFirst({
      where: eq(shopTable.slug, slug),
    });

    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async execute(
    slug: string,
    query: ListPublicShopProductsQueryDto,
    lang: string = 'en',
  ) {
    const shop = await this.assertPublicShop(slug);
    const { page, limit, search, sort } = query;
    const offset = (page - 1) * limit;

    const baseWhere = and(
      eq(productsTable.shopId, shop.id),
      eq(productsTable.status, 'ACTIVE'),
      eq(productsTable.productType, 'plant'),
      search?.trim()
        ? or(
            ilike(productsTable.slug, `%${search.trim()}%`),
            sql`exists (
              select 1 from ${productTranslationsTable}
              where ${productTranslationsTable.productId} = ${productsTable.id}
              and ${productTranslationsTable.name} ilike ${`%${search.trim()}%`}
            )`,
          )
        : undefined,
    );

    const [{ total }] = await this.db.client
      .select({ total: count() })
      .from(productsTable)
      .where(baseWhere);

    const orderBy =
      sort === 'price_asc'
        ? [asc(productVariantsTable.price)]
        : sort === 'price_desc'
          ? [desc(productVariantsTable.price)]
          : sort === 'newest'
            ? [desc(productsTable.createdAt)]
            : [desc(productsTable.createdAt)];

    const rows = await this.db.client
      .select({
        id: productsTable.id,
        slug: productsTable.slug,
        productType: productsTable.productType,
        name: productTranslationsTable.name,
        price: productVariantsTable.price,
        inventoryCount: productVariantsTable.inventoryCount,
        thumbnailUrl: mediaTable.url,
        createdAt: productsTable.createdAt,
      })
      .from(productsTable)
      .leftJoin(
        productTranslationsTable,
        and(
          eq(productTranslationsTable.productId, productsTable.id),
          eq(productTranslationsTable.locale, lang),
        ),
      )
      .leftJoin(
        productVariantsTable,
        and(
          eq(productVariantsTable.productId, productsTable.id),
          eq(productVariantsTable.isBase, true),
        ),
      )
      .leftJoin(mediaTable, eq(mediaTable.id, productsTable.thumbnailId))
      .where(baseWhere)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const productIds = rows.map((r) => r.id);
    const reviewStats = productIds.length
      ? await this.db.client
          .select({
            productId: reviewsTable.productId,
            avg: sql<string>`coalesce(avg(${reviewsTable.rating}), 0)`,
            cnt: count(),
          })
          .from(reviewsTable)
          .where(
            and(
              inArray(reviewsTable.productId, productIds),
              eq(reviewsTable.status, ReviewStatusEnum.APPROVED),
              eq(reviewsTable.isRemovedByAdmin, false),
            ),
          )
          .groupBy(reviewsTable.productId)
      : [];

    const reviewMap = new Map(
      reviewStats.map((r) => [
        r.productId,
        { avg: Number(r.avg), cnt: Number(r.cnt) },
      ]),
    );

    const data: PublicShopProductDto[] = rows.map((row) => {
      const reviews = reviewMap.get(row.id) ?? { avg: 0, cnt: 0 };
      return {
        id: row.id,
        slug: row.slug,
        name: row.name ?? row.slug,
        price: Number(row.price ?? 0),
        compareAtPrice: null,
        thumbnailUrl: row.thumbnailUrl ?? null,
        rating: reviews.avg,
        reviewCount: reviews.cnt,
        soldCount: 0,
        inStock: (row.inventoryCount ?? 0) > 0,
        productType: row.productType,
        isFeatured: false,
      };
    });

    if (sort === 'rating') {
      data.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'popular') {
      data.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return paginate(data, total, page, limit);
  }
}
