import { Injectable, Logger } from '@nestjs/common';
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
  gte,
  lte,
  gt,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  productsTable,
  productTranslationsTable,
  productVariantsTable,
  plantDetailsTable,
  plantDetailsTagsTable,
  mediaTable,
} from '@/_db/drizzle/schema';
import { shopTable, shopTranslationsTable } from '@/_db/drizzle/schema/shop';
import { paginate } from '@/libs/utils/pagination.util';
import { ListPublicPlantsQueryDto } from '../../controllers/dto/list-public-plants-query.dto';
import { mapVariantStockToApi } from '../../mappers/variant-stock.mapper';
import {
  CareDifficultyEnum,
  LightRequirementEnum,
  WateringFrequencyEnum,
  HumidityLevelEnum,
  GrowthRateEnum,
} from '@/_db/drizzle/enum';

const shopLogoMedia = alias(mediaTable, 'shop_logo_media');

export type PublicPlantListItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  scientificName: string | null;
  commonNames: string | null;
  price: string | null;
  inventoryCount: number;
  inStock: boolean;
  thumbnail: { id: string; url: string } | null;
  category: { id: string; slug: string; name: string | null } | null;
  tags: { id: string; slug: string; name: string | null }[];
  careDifficulty: string | null;
  lightRequirement: string | null;
  wateringFrequency: string | null;
  humidityLevel: string | null;
  growthRate: string | null;
  shop: {
    id: string;
    slug: string;
    name: string;
    logo: { id: string; url: string } | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ListPublicPlantsQuery {
  private readonly logger = new Logger(ListPublicPlantsQuery.name);

  constructor(private readonly db: DrizzleService) {}

  async execute(query: ListPublicPlantsQueryDto, lang: string = 'en') {
    try {
      const {
        page,
        limit,
        search,
        categoryId,
        tagIds,
        careDifficulty,
        lightRequirement,
        wateringFrequency,
        humidityLevel,
        growthRate,
        minPrice,
        maxPrice,
        inStockOnly,
        sortBy,
        sortOrder,
      } = query;
      const offset = (page - 1) * limit;
      const isAsc = sortOrder === 'asc';

      const baseWhere = and(
        eq(productsTable.productType, 'plant'),
        eq(productsTable.status, 'ACTIVE'),
        exists(
          this.db.client
            .select({ id: shopTable.id })
            .from(shopTable)
            .where(
              and(
                eq(shopTable.id, productsTable.shopId),
                eq(shopTable.status, 'ACTIVE'),
              ),
            ),
        ),
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
        careDifficulty
          ? exists(
              this.db.client
                .select({ id: plantDetailsTable.id })
                .from(plantDetailsTable)
                .where(
                  and(
                    eq(plantDetailsTable.productId, productsTable.id),
                    eq(
                      plantDetailsTable.careDifficulty,
                      careDifficulty as (typeof CareDifficultyEnum)[keyof typeof CareDifficultyEnum],
                    ),
                  ),
                ),
            )
          : undefined,
        lightRequirement
          ? exists(
              this.db.client
                .select({ id: plantDetailsTable.id })
                .from(plantDetailsTable)
                .where(
                  and(
                    eq(plantDetailsTable.productId, productsTable.id),
                    eq(
                      plantDetailsTable.lightRequirement,
                      lightRequirement as (typeof LightRequirementEnum)[keyof typeof LightRequirementEnum],
                    ),
                  ),
                ),
            )
          : undefined,
        wateringFrequency
          ? exists(
              this.db.client
                .select({ id: plantDetailsTable.id })
                .from(plantDetailsTable)
                .where(
                  and(
                    eq(plantDetailsTable.productId, productsTable.id),
                    eq(
                      plantDetailsTable.wateringFrequency,
                      wateringFrequency as (typeof WateringFrequencyEnum)[keyof typeof WateringFrequencyEnum],
                    ),
                  ),
                ),
            )
          : undefined,
        humidityLevel
          ? exists(
              this.db.client
                .select({ id: plantDetailsTable.id })
                .from(plantDetailsTable)
                .where(
                  and(
                    eq(plantDetailsTable.productId, productsTable.id),
                    eq(
                      plantDetailsTable.humidityLevel,
                      humidityLevel as (typeof HumidityLevelEnum)[keyof typeof HumidityLevelEnum],
                    ),
                  ),
                ),
            )
          : undefined,
        growthRate
          ? exists(
              this.db.client
                .select({ id: plantDetailsTable.id })
                .from(plantDetailsTable)
                .where(
                  and(
                    eq(plantDetailsTable.productId, productsTable.id),
                    eq(
                      plantDetailsTable.growthRate,
                      growthRate as (typeof GrowthRateEnum)[keyof typeof GrowthRateEnum],
                    ),
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
              exists(
                this.db.client
                  .select({ id: plantDetailsTable.id })
                  .from(plantDetailsTable)
                  .where(
                    and(
                      eq(plantDetailsTable.productId, productsTable.id),
                      or(
                        ilike(plantDetailsTable.scientificName, `%${search}%`),
                        ilike(plantDetailsTable.commonNames, `%${search}%`),
                      ),
                    ),
                  ),
              ),
              exists(
                this.db.client
                  .select({ id: productTranslationsTable.id })
                  .from(productTranslationsTable)
                  .where(
                    and(
                      eq(productTranslationsTable.productId, productsTable.id),
                      ilike(
                        productTranslationsTable.shortDescription,
                        `%${search}%`,
                      ),
                    ),
                  ),
              ),
            )
          : undefined,
        tagIds && tagIds.length > 0
          ? exists(
              this.db.client
                .select({ count: count() })
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
                )
                .having(sql`count(*) = ${tagIds.length}`),
            )
          : undefined,
        minPrice !== undefined
          ? exists(
              this.db.client
                .select({ id: productVariantsTable.id })
                .from(productVariantsTable)
                .where(
                  and(
                    eq(productVariantsTable.productId, productsTable.id),
                    eq(productVariantsTable.isBase, true),
                    gte(productVariantsTable.price, String(minPrice)),
                  ),
                ),
            )
          : undefined,
        maxPrice !== undefined
          ? exists(
              this.db.client
                .select({ id: productVariantsTable.id })
                .from(productVariantsTable)
                .where(
                  and(
                    eq(productVariantsTable.productId, productsTable.id),
                    eq(productVariantsTable.isBase, true),
                    lte(productVariantsTable.price, String(maxPrice)),
                  ),
                ),
            )
          : undefined,
        inStockOnly
          ? exists(
              this.db.client
                .select({ id: productVariantsTable.id })
                .from(productVariantsTable)
                .where(
                  and(
                    eq(productVariantsTable.productId, productsTable.id),
                    eq(productVariantsTable.isBase, true),
                    gt(productVariantsTable.availableQuantity, 0),
                  ),
                ),
            )
          : undefined,
      );

      const [{ total }] = await this.db.client
        .select({ total: count() })
        .from(productsTable)
        .where(baseWhere)
        .execute();

      const rows = await this.db.client
        .select({
          productId: productsTable.id,
          slug: productsTable.slug,
          thumbnailId: productsTable.thumbnailId,
          thumbnailUrl: mediaTable.url,
          name: productTranslationsTable.name,
          shortDescription: productTranslationsTable.shortDescription,
          scientificName: plantDetailsTable.scientificName,
          commonNames: plantDetailsTable.commonNames,
          price: productVariantsTable.price,
          availableQuantity: productVariantsTable.availableQuantity,
          stockStatus: productVariantsTable.stockStatus,
          careDifficulty: plantDetailsTable.careDifficulty,
          lightRequirement: plantDetailsTable.lightRequirement,
          wateringFrequency: plantDetailsTable.wateringFrequency,
          humidityLevel: plantDetailsTable.humidityLevel,
          growthRate: plantDetailsTable.growthRate,
          shopId: shopTable.id,
          shopSlug: shopTable.slug,
          shopName: shopTranslationsTable.name,
          shopLogoId: shopTable.logoId,
          shopLogoUrl: shopLogoMedia.url,
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
        .leftJoin(
          plantDetailsTable,
          eq(plantDetailsTable.productId, productsTable.id),
        )
        .leftJoin(shopTable, eq(shopTable.id, productsTable.shopId))
        .leftJoin(
          shopTranslationsTable,
          and(
            eq(shopTranslationsTable.shopId, shopTable.id),
            eq(shopTranslationsTable.locale, lang),
          ),
        )
        .leftJoin(shopLogoMedia, eq(shopLogoMedia.id, shopTable.logoId))
        .where(baseWhere)
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
            case 'difficulty': {
              const difficultyOrder = sql`CASE ${plantDetailsTable.careDifficulty}
                WHEN 'BEGINNER' THEN 1
                WHEN 'INTERMEDIATE' THEN 2
                WHEN 'EXPERT' THEN 3
                ELSE 4 END`;
              return isAsc ? asc(difficultyOrder) : desc(difficultyOrder);
            }
            case 'inventory':
              return isAsc
                ? asc(productVariantsTable.availableQuantity)
                : desc(productVariantsTable.availableQuantity);
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
        return paginate<PublicPlantListItem>([], Number(total), page, limit);
      }

      const productIds = rows.map((r) => r.productId);

      const plantDetails =
        await this.db.client.query.plantDetailsTable.findMany({
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

      const result: PublicPlantListItem[] = rows.map((row) => {
        const plantDetail = plantDetailMap.get(row.productId);
        const catTrans = plantDetail?.category?.translations?.find(
          (t) => t.locale === lang,
        );

        const tags =
          plantDetail?.tags?.map((pt) => {
            const tagTrans = pt.tag?.translations?.find(
              (t) => t.locale === lang,
            );
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
          name: row.name ?? 'Untitled Plant',
          shortDescription: row.shortDescription ?? null,
          scientificName: row.scientificName ?? null,
          commonNames: row.commonNames ?? null,
          price: row.price ?? null,
          inventoryCount: stock.inventoryCount,
          inStock: stock.inStock,
          thumbnail:
            row.thumbnailId && row.thumbnailUrl
              ? { id: row.thumbnailId, url: row.thumbnailUrl }
              : null,
          category: plantDetail?.category
            ? {
                id: plantDetail.category.id,
                slug: plantDetail.category.slug,
                name: catTrans?.name ?? null,
              }
            : null,
          tags,
          careDifficulty: row.careDifficulty ?? null,
          lightRequirement: row.lightRequirement ?? null,
          wateringFrequency: row.wateringFrequency ?? null,
          humidityLevel: row.humidityLevel ?? null,
          growthRate: row.growthRate ?? null,
          shop: row.shopId
            ? {
                id: row.shopId,
                slug: row.shopSlug ?? '',
                name: row.shopName ?? 'Shop',
                logo:
                  row.shopLogoId && row.shopLogoUrl
                    ? { id: row.shopLogoId, url: row.shopLogoUrl }
                    : null,
              }
            : null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      });

      return paginate(result, Number(total), page, limit);
    } catch (error) {
      this.logger.error(
        'Failed to list public plants',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
