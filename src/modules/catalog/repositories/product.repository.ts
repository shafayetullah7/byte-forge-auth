import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  or,
} from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  mediaTable,
  productTranslationsTable,
  productVariantsTable,
  productsTable,
} from '@/_db/drizzle/schema';
import type { ListProductsQueryDto } from '../controllers/dto/list-products-query.dto';
import type { CatalogProductSummary } from '../application/queries/catalog.query';

export type ProductListRow = {
  productId: string;
  slug: string;
  productType: string;
  status: string;
  thumbnailId: string | null;
  thumbnailUrl: string | null;
  name: string | null;
  shortDescription: string | null;
  price: string | null;
  availableQuantity: number | null;
  stockStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ProductRepository {
  private readonly logger = new Logger(ProductRepository.name);

  constructor(private readonly db: DrizzleService) {}

  async listForShop(
    shopId: string,
    query: ListProductsQueryDto,
    lang: string,
  ): Promise<{ rows: ProductListRow[]; total: number }> {
    const { page, limit, search, productType, status, sortBy, sortOrder } =
      query;
    const offset = (page - 1) * limit;
    const isAsc = sortOrder === 'asc';

    const where = and(
      eq(productsTable.shopId, shopId),
      productType ? eq(productsTable.productType, productType) : undefined,
      status ? eq(productsTable.status, status) : undefined,
      search
        ? or(
            ilike(productsTable.slug, `%${search}%`),
            exists(
              this.db.client
                .select({ id: productTranslationsTable.id })
                .from(productTranslationsTable)
                .where(
                  and(
                    eq(productTranslationsTable.productId, productsTable.id),
                    ilike(productTranslationsTable.name, `%${search}%`),
                  ),
                ),
            ),
          )
        : undefined,
    );

    try {
      const [{ total }] = await this.db.client
        .select({ total: count() })
        .from(productsTable)
        .where(where)
        .execute();

      const rows = await this.db.client
        .select({
          productId: productsTable.id,
          slug: productsTable.slug,
          productType: productsTable.productType,
          status: productsTable.status,
          thumbnailId: productsTable.thumbnailId,
          thumbnailUrl: mediaTable.url,
          name: productTranslationsTable.name,
          shortDescription: productTranslationsTable.shortDescription,
          price: productVariantsTable.price,
          availableQuantity: productVariantsTable.availableQuantity,
          stockStatus: productVariantsTable.stockStatus,
          createdAt: productsTable.createdAt,
          updatedAt: productsTable.updatedAt,
        })
        .from(productsTable)
        .leftJoin(mediaTable, eq(mediaTable.id, productsTable.thumbnailId))
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
        .where(where)
        .orderBy(() => {
          switch (sortBy) {
            case 'name':
              return isAsc
                ? asc(productTranslationsTable.name)
                : desc(productTranslationsTable.name);
            case 'price':
              return isAsc
                ? asc(productVariantsTable.price)
                : desc(productVariantsTable.price);
            case 'inventory':
              return isAsc
                ? asc(productVariantsTable.availableQuantity)
                : desc(productVariantsTable.availableQuantity);
            case 'updatedAt':
              return isAsc
                ? asc(productsTable.updatedAt)
                : desc(productsTable.updatedAt);
            case 'createdAt':
            default:
              return isAsc
                ? asc(productsTable.createdAt)
                : desc(productsTable.createdAt);
          }
        })
        .limit(limit)
        .offset(offset);

      return { rows, total: Number(total) };
    } catch (error) {
      this.logger.error(
        `Failed to fetch products for shop ${shopId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  findDetailForShop(shopId: string, productId: string) {
    return this.db.client.query.productsTable.findFirst({
      where: and(
        eq(productsTable.shopId, shopId),
        eq(productsTable.id, productId),
      ),
      with: {
        thumbnail: {
          columns: { id: true, url: true },
        },
        translations: {
          columns: {
            locale: true,
            name: true,
            description: true,
            shortDescription: true,
          },
        },
        variants: {
          columns: {
            id: true,
            sku: true,
            price: true,
            availableQuantity: true,
            stockStatus: true,
            isBase: true,
            isActive: true,
          },
        },
      },
    });
  }

  findSummaryForShop(shopId: string, productId: string, lang: string) {
    return this.db.client.query.productsTable.findFirst({
      where: and(
        eq(productsTable.shopId, shopId),
        eq(productsTable.id, productId),
      ),
      columns: {
        id: true,
        slug: true,
        productType: true,
        status: true,
      },
      with: {
        translations: {
          where: (t, { eq: eqCol }) => eqCol(t.locale, lang),
          columns: { name: true, shortDescription: true },
        },
      },
    });
  }

  findOverviewForShop(shopId: string, productId: string) {
    return this.db.client.query.productsTable.findFirst({
      where: and(
        eq(productsTable.shopId, shopId),
        eq(productsTable.id, productId),
      ),
      columns: {
        id: true,
        status: true,
        createdAt: true,
      },
      with: {
        thumbnail: {
          columns: { id: true, url: true },
        },
        variants: {
          columns: {
            id: true,
            sku: true,
            price: true,
            availableQuantity: true,
            stockStatus: true,
            isBase: true,
            isActive: true,
          },
        },
      },
    });
  }

  async findSummariesByIds(
    ids: string[],
    lang: string = 'en',
  ): Promise<CatalogProductSummary[]> {
    if (ids.length === 0) return [];

    const rows = await this.db.client
      .select({
        id: productsTable.id,
        slug: productsTable.slug,
        name: productTranslationsTable.name,
        thumbnailUrl: mediaTable.url,
        thumbnailId: productsTable.thumbnailId,
      })
      .from(productsTable)
      .leftJoin(
        productTranslationsTable,
        and(
          eq(productTranslationsTable.productId, productsTable.id),
          eq(productTranslationsTable.locale, lang),
        ),
      )
      .leftJoin(mediaTable, eq(mediaTable.id, productsTable.thumbnailId))
      .where(inArray(productsTable.id, ids));

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name ?? row.slug,
      thumbnailUrl: row.thumbnailUrl ?? null,
      thumbnailId: row.thumbnailId ?? null,
    }));
  }
}
