import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { paginate } from '@/libs/utils/pagination.util';
import { mapVariantStockToApi } from '../../mappers/variant-stock.mapper';
import { ShopQueryService } from '@/modules/shop/application/queries';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  plantDetailsTagsTable,
  plantDetailsTable,
  productTranslationsTable,
  productVariantsTable,
  productsTable,
  mediaTable,
} from '@/_db/drizzle/schema';
import { ListPlantsQueryDto } from '../../controllers/dto/list-plants-query.dto';
import {
  and,
  count,
  eq,
  exists,
  ilike,
  inArray,
  or,
  asc,
  desc,
} from 'drizzle-orm';

export type PlantListItem = {
  id: string;
  slug: string;
  status: string;
  thumbnail: { id: string; url: string } | null;
  name: string | null;
  shortDescription: string | null;
  price: string | null;
  inventoryCount: number;
  category: { id: string; slug: string; name: string | null } | null;
  tags: { id: string; slug: string; name: string | null }[];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ListSellerPlantsQuery {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopQueryService: ShopQueryService,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    userId: string,
    query: ListPlantsQueryDto,
    lang: string = 'en',
  ) {
    const shop = await this.resolveShop(userId, lang);
    return this.executeForShop(shop.id, query, lang);
  }

  async executeForShop(
    shopId: string,
    query: ListPlantsQueryDto,
    lang: string = 'en',
  ) {
    const {
      page,
      limit,
      search,
      status,
      categoryId,
      tagIds,
      sortBy,
      sortOrder,
    } = query;
    const offset = (page - 1) * limit;
    const isAsc = sortOrder === 'asc';

    const baseWhere = and(
      eq(productsTable.shopId, shopId),
      eq(productsTable.productType, 'plant'),
      status ? eq(productsTable.status, status) : undefined,
      categoryId
        ? exists(
            this.db.client
              .select({ id: plantDetailsTable.id })
              .from(plantDetailsTable)
              .where(
                and(
                  eq(plantDetailsTable.productId, productsTable.id),
                  eq(plantDetailsTable.categoryId, categoryId),
                ),
              ),
          )
        : undefined,
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

    const tagWhere =
      tagIds && tagIds.length > 0
        ? exists(
            this.db.client
              .select({ id: plantDetailsTagsTable.tagId })
              .from(plantDetailsTagsTable)
              .innerJoin(
                plantDetailsTable,
                eq(plantDetailsTagsTable.plantId, plantDetailsTable.id),
              )
              .where(
                and(
                  eq(plantDetailsTable.productId, productsTable.id),
                  inArray(plantDetailsTagsTable.tagId, tagIds),
                ),
              ),
          )
        : undefined;

    const fullWhere = tagWhere ? and(baseWhere, tagWhere) : baseWhere;

    const [{ total }] = await this.db.client
      .select({ total: count() })
      .from(productsTable)
      .where(fullWhere)
      .execute();

    const rows = await this.db.client
      .select({
        productId: productsTable.id,
        slug: productsTable.slug,
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
      .where(fullWhere)
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

    if (rows.length === 0) {
      return paginate<PlantListItem>([], Number(total), page, limit);
    }

    const productIds = rows.map((r) => r.productId);

    const plantDetails = await this.db.client.query.plantDetailsTable.findMany({
      where: inArray(plantDetailsTable.productId, productIds),
      with: {
        category: {
          columns: { id: true, slug: true },
          with: {
            translations: { columns: { locale: true, name: true } },
          },
        },
        tags: {
          with: {
            tag: {
              columns: { id: true, slug: true },
              with: {
                translations: {
                  columns: { locale: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    const plantDetailMap = new Map(plantDetails.map((d) => [d.productId, d]));

    const result: PlantListItem[] = rows.map((row) => {
      const plantDetail = plantDetailMap.get(row.productId);
      const catTrans = plantDetail?.category?.translations?.find(
        (t) => t.locale === lang,
      );

      const tags =
        plantDetail?.tags?.map((pt) => {
          const tagTrans = pt.tag?.translations?.find((t) => t.locale === lang);
          return {
            id: pt.tag.id,
            slug: pt.tag.slug,
            name: tagTrans?.name ?? null,
          };
        }) ?? [];

      const stock = mapVariantStockToApi(
        row.availableQuantity,
        row.stockStatus,
      );

      return {
        id: row.productId,
        slug: row.slug,
        status: row.status,
        thumbnail:
          row.thumbnailId && row.thumbnailUrl
            ? { id: row.thumbnailId, url: row.thumbnailUrl }
            : null,
        name: row.name ?? null,
        shortDescription: row.shortDescription ?? null,
        price: row.price ?? null,
        inventoryCount: stock.inventoryCount,
        category: plantDetail?.category
          ? {
              id: plantDetail.category.id,
              slug: plantDetail.category.slug,
              name: catTrans?.name ?? null,
            }
          : null,
        tags,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });

    return paginate(result, Number(total), page, limit);
  }

  private async resolveShop(userId: string, lang: string) {
    const shop = await this.shopQueryService.getShopByOwnerId(userId);
    if (!shop) {
      throw new CustomException({
        message: this.i18n.t('message.error.shopNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }
    return shop;
  }
}
