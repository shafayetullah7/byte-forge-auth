import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productsTable, productSeoTable } from '@/_db/drizzle/schema';
import { shopTable } from '@/_db/drizzle/schema/shop';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { mapVariantStockToApi } from '../../mappers/variant-stock.mapper';

export type PublicPlantDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  scientificName: string | null;
  commonNames: string | null;
  price: string | null;
  inventoryCount: number;
  inStock: boolean;
  variants: Array<{
    id: string;
    sku: string | null;
    price: string;
    inventoryCount: number;
    inStock: boolean;
    title: string | null;
    isBase: boolean;
    isActive: boolean;
    plantAttributes: {
      growthStage: string;
      plantForm: string;
      variegation: string;
      leafDensity: string;
      stemCount: number;
      currentHeight: string | null;
      currentSpread: string | null;
      propagationType: string;
      containerType: string;
      containerSize: string | null;
      bundleType: string | null;
    } | null;
    media: Array<{
      id: string;
      url: string;
      type: string;
      displayOrder: number;
    }>;
  }>;
  thumbnail: { id: string; url: string } | null;
  media: Array<{
    id: string;
    url: string;
    type: string;
    displayOrder: number;
  }>;
  category: {
    id: string;
    slug: string;
    name: string | null;
  } | null;
  tags: Array<{
    id: string;
    slug: string;
    name: string | null;
  }>;
  careDifficulty: string | null;
  lightRequirement: string | null;
  wateringFrequency: string | null;
  humidityLevel: string | null;
  temperatureRange: string | null;
  soilType: string | null;
  growthRate: string | null;
  matureHeight: string | null;
  matureSpread: string | null;
  origin: string | null;
  toxicityInfo: string | null;
  careInstructions: {
    lightInstructions: string | null;
    wateringInstructions: string | null;
    humidityInstructions: string | null;
    fertilizerSchedule: string | null;
    repottingFrequency: string | null;
    pruningNotes: string | null;
    commonProblems: string | null;
    seasonalCare: string | null;
  } | null;
  shop: {
    id: string;
    slug: string;
    name: string;
    isVerified: boolean;
    logo: { id: string; url: string } | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  } | null;
  seo: {
    metaTitle: string | null;
    metaDescription: string | null;
    focusKeywords: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

type QueryResult = Awaited<
  ReturnType<GetPublicPlantBySlugQuery['queryProduct']>
>;
type ProductWithRelations = NonNullable<QueryResult>;

type ShopQueryResult = {
  id: string;
  slug: string;
  isVerified: boolean;
  logo: { id: string; url: string } | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  translations: Array<{ locale: string; name: string }>;
};

type SeoResult = {
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeywords: string | null;
} | null;

@Injectable()
export class GetPublicPlantBySlugQuery {
  private readonly logger = new Logger(GetPublicPlantBySlugQuery.name);

  constructor(private readonly db: DrizzleService) {}

  private queryProduct(slug: string) {
    return this.db.client.query.productsTable.findFirst({
      where: and(
        eq(productsTable.slug, slug),
        eq(productsTable.productType, 'plant'),
        eq(productsTable.status, 'ACTIVE'),
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
        plantDetails: {
          with: {
            category: {
              columns: { id: true, slug: true },
              with: {
                translations: {
                  columns: { locale: true, name: true },
                },
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
            translations: {
              columns: {
                locale: true,
                commonNames: true,
                origin: true,
                soilType: true,
                toxicityInfo: true,
              },
            },
          },
        },
        careInstructions: {
          columns: {
            id: true,
            lightInstructions: true,
            wateringInstructions: true,
            humidityInstructions: true,
            fertilizerSchedule: true,
            repottingFrequency: true,
            pruningNotes: true,
            commonProblems: true,
            seasonalCare: true,
          },
          with: {
            translations: {
              columns: {
                locale: true,
                lightInstructions: true,
                wateringInstructions: true,
                humidityInstructions: true,
                fertilizerSchedule: true,
                repottingFrequency: true,
                pruningNotes: true,
                commonProblems: true,
                seasonalCare: true,
              },
            },
          },
        },
        variants: {
          with: {
            plantAttributes: true,
            translations: {
              columns: { locale: true, title: true },
            },
            media: {
              with: {
                media: {
                  columns: { id: true, url: true },
                },
              },
            },
          },
        },
        media: {
          with: {
            media: {
              columns: { id: true, url: true },
            },
          },
        },
      },
    });
  }

  async execute(slug: string, lang: string = 'en'): Promise<PublicPlantDetail> {
    try {
      const product = await this.queryProduct(slug);

      if (!product) {
        throw new NotFoundException(`Plant with slug "${slug}" not found`);
      }

      const shop = await this.db.client.query.shopTable.findFirst({
        where: eq(shopTable.id, product.shopId),
        with: {
          logo: {
            columns: { id: true, url: true },
          },
          translations: {
            columns: { locale: true, name: true },
          },
        },
      });

      if (!shop || shop.status !== 'ACTIVE') {
        throw new NotFoundException(`Plant with slug "${slug}" not found`);
      }

      const [seo] = await this.db.client
        .select()
        .from(productSeoTable)
        .where(eq(productSeoTable.productId, product.id))
        .execute();

      return this.mapDetail(product, shop, seo ?? null, lang);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Failed to get plant by slug: ${slug}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private mapDetail(
    product: ProductWithRelations,
    shop: ShopQueryResult,
    seo: SeoResult,
    lang: string,
  ): PublicPlantDetail {
    const translation = resolveTranslation(product.translations, lang);
    const baseVariant = product.variants.find((v) => v.isBase);

    const variants = product.variants.map((v) => {
      const stock = mapVariantStockToApi(v.availableQuantity, v.stockStatus);
      return {
        id: v.id,
        sku: v.sku,
        price: v.price,
        inventoryCount: stock.inventoryCount,
        inStock: stock.inStock,
        title: resolveTranslation(v.translations, lang)?.title ?? null,
      isBase: v.isBase,
      isActive: v.isActive,
      plantAttributes: v.plantAttributes
        ? {
            growthStage: v.plantAttributes.growthStage,
            plantForm: v.plantAttributes.plantForm,
            variegation: v.plantAttributes.variegation,
            leafDensity: v.plantAttributes.leafDensity,
            stemCount: v.plantAttributes.stemCount ?? 0,
            currentHeight: v.plantAttributes.currentHeight,
            currentSpread: v.plantAttributes.currentSpread,
            propagationType: v.plantAttributes.propagationType,
            containerType: v.plantAttributes.containerType,
            containerSize: v.plantAttributes.containerSize,
            bundleType: v.plantAttributes.bundleType,
          }
        : null,
      media: v.media
        .filter(
          (m): m is typeof m & { media: NonNullable<typeof m.media> } =>
            m.media != null,
        )
        .map((m) => ({
          id: m.id,
          url: m.media.url,
          type: m.type,
          displayOrder: m.displayOrder,
        })),
      };
    });

    const productMedia = product.media
      .filter(
        (m): m is typeof m & { media: NonNullable<typeof m.media> } =>
          m.media != null,
      )
      .map((m) => ({
        id: m.id,
        url: m.media.url,
        type: m.type,
        displayOrder: m.displayOrder,
      }));

    const category = product.plantDetails?.category
      ? {
          id: product.plantDetails.category.id,
          slug: product.plantDetails.category.slug,
          name:
            resolveTranslation(product.plantDetails.category.translations, lang)
              ?.name ?? null,
        }
      : null;

    const tags =
      product.plantDetails?.tags?.map((pt) => {
        const tagTrans = resolveTranslation(pt.tag.translations, lang);
        return {
          id: pt.tag.id,
          slug: pt.tag.slug,
          name: tagTrans?.name ?? null,
        };
      }) ?? [];

    const careTranslation = resolveTranslation(
      product.plantDetails?.translations,
      lang,
    );

    const careInstructions = product.careInstructions
      ? (() => {
          const careAll = [
            {
              locale: 'en' as const,
              lightInstructions: product.careInstructions.lightInstructions,
              wateringInstructions:
                product.careInstructions.wateringInstructions,
              humidityInstructions:
                product.careInstructions.humidityInstructions,
              fertilizerSchedule: product.careInstructions.fertilizerSchedule,
              repottingFrequency: product.careInstructions.repottingFrequency,
              pruningNotes: product.careInstructions.pruningNotes,
              commonProblems: product.careInstructions.commonProblems,
              seasonalCare: product.careInstructions.seasonalCare,
            },
            ...product.careInstructions.translations,
          ];
          const resolved = resolveTranslation(careAll, lang);
          return {
            lightInstructions: resolved?.lightInstructions ?? null,
            wateringInstructions: resolved?.wateringInstructions ?? null,
            humidityInstructions: resolved?.humidityInstructions ?? null,
            fertilizerSchedule: resolved?.fertilizerSchedule ?? null,
            repottingFrequency: resolved?.repottingFrequency ?? null,
            pruningNotes: resolved?.pruningNotes ?? null,
            commonProblems: resolved?.commonProblems ?? null,
            seasonalCare: resolved?.seasonalCare ?? null,
          };
        })()
      : null;

    const shopInfo = shop
      ? {
          id: shop.id,
          slug: shop.slug,
          name: resolveTranslation(shop.translations, lang)?.name ?? 'Shop',
          isVerified: shop.isVerified,
          logo: shop.logo ? { id: shop.logo.id, url: shop.logo.url } : null,
          primaryColor: shop.primaryColor,
          secondaryColor: shop.secondaryColor,
        }
      : null;

    const seoData = seo
      ? {
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          focusKeywords: seo.focusKeywords,
        }
      : null;

    const baseStock = mapVariantStockToApi(
      baseVariant?.availableQuantity,
      baseVariant?.stockStatus,
    );

    return {
      id: product.id,
      slug: product.slug,
      name: translation?.name ?? 'Untitled Plant',
      description: translation?.description ?? null,
      shortDescription: translation?.shortDescription ?? null,
      scientificName: product.plantDetails?.scientificName ?? null,
      commonNames:
        careTranslation?.commonNames ??
        product.plantDetails?.commonNames ??
        null,
      price: baseVariant?.price ?? null,
      inventoryCount: baseStock.inventoryCount,
      inStock: baseStock.inStock,
      variants,
      thumbnail: product.thumbnail
        ? { id: product.thumbnail.id, url: product.thumbnail.url }
        : null,
      media: productMedia,
      category,
      tags,
      careDifficulty: product.plantDetails?.careDifficulty ?? null,
      lightRequirement: product.plantDetails?.lightRequirement ?? null,
      wateringFrequency: product.plantDetails?.wateringFrequency ?? null,
      humidityLevel: product.plantDetails?.humidityLevel ?? null,
      temperatureRange: product.plantDetails?.temperatureRange ?? null,
      soilType:
        careTranslation?.soilType ?? product.plantDetails?.soilType ?? null,
      growthRate: product.plantDetails?.growthRate ?? null,
      matureHeight: product.plantDetails?.matureHeight ?? null,
      matureSpread: product.plantDetails?.matureSpread ?? null,
      origin: careTranslation?.origin ?? product.plantDetails?.origin ?? null,
      toxicityInfo:
        careTranslation?.toxicityInfo ??
        product.plantDetails?.toxicityInfo ??
        null,
      careInstructions,
      shop: shopInfo,
      seo: seoData,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
