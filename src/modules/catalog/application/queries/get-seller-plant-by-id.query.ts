import { HttpStatus, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productsTable } from '@/_db/drizzle/schema';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { ShopQueryService } from '@/modules/shop/application/queries';

const DEFAULT_INVENTORY_COUNT = 0;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;
const DEFAULT_STEM_COUNT = 0;

export type PlantDetailResult = {
  id: string;
  slug: string;
  status: string;
  thumbnail: { id: string; url: string } | null;
  translations: Array<{
    locale: string;
    name: string;
    description: string | null;
    shortDescription: string | null;
  }>;
  plantDetails: {
    id: string;
    categoryId: string | null;
    scientificName: string | null;
    commonNames: string | null;
    origin: string | null;
    lightRequirement: string | null;
    wateringFrequency: string | null;
    humidityLevel: string | null;
    temperatureRange: string | null;
    soilType: string | null;
    careDifficulty: string | null;
    growthRate: string | null;
    matureHeight: string | null;
    matureSpread: string | null;
    toxicityInfo: string | null;
    category: {
      id: string;
      slug: string;
      translations: Array<{ locale: string; name: string }>;
    } | null;
    tags: Array<{
      id: string;
      slug: string;
      translations: Array<{ locale: string; name: string }>;
    }>;
    translations: Array<{
      locale: string;
      commonNames: string | null;
      origin: string | null;
      soilType: string | null;
      toxicityInfo: string | null;
    }>;
  } | null;
  careInstructions: {
    id: string;
    lightInstructions: string | null;
    wateringInstructions: string | null;
    humidityInstructions: string | null;
    fertilizerSchedule: string | null;
    repottingFrequency: string | null;
    pruningNotes: string | null;
    commonProblems: string | null;
    seasonalCare: string | null;
    translations: Array<{
      locale: string;
      lightInstructions: string | null;
      wateringInstructions: string | null;
      humidityInstructions: string | null;
      fertilizerSchedule: string | null;
      repottingFrequency: string | null;
      pruningNotes: string | null;
      commonProblems: string | null;
      seasonalCare: string | null;
    }>;
  } | null;
  variants: Array<{
    id: string;
    sku: string | null;
    price: string;
    inventoryCount: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    displayOrder: number;
    isBase: boolean;
    isActive: boolean;
    plantAttributes: {
      id: string;
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
    translations: Array<{
      locale: string;
      title: string;
    }>;
    media: Array<{
      id: string;
      mediaId: string;
      displayOrder: number;
      type: string;
      url: string;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

type DrizzleProduct = NonNullable<
  Awaited<ReturnType<GetSellerPlantByIdQuery['queryProduct']>>
>;

@Injectable()
export class GetSellerPlantByIdQuery {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopQueryService: ShopQueryService,
    private readonly i18n: I18nService,
  ) {}

  private queryProduct(shopId: string, plantId: string) {
    return this.db.client.query.productsTable.findFirst({
      where: and(
        eq(productsTable.id, plantId),
        eq(productsTable.shopId, shopId),
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
      },
    });
  }

  async execute(userId: string, plantId: string, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    const plant = await this.executeForShop(shop.id, plantId);
    if (!plant) {
      throw new CustomException({
        message: this.i18n.t('message.error.plantNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }
    return plant;
  }

  async executeForShop(
    shopId: string,
    plantId: string,
  ): Promise<PlantDetailResult | null> {
    const product = await this.queryProduct(shopId, plantId);
    if (!product) return null;
    return this.mapResult(product);
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

  private mapResult(product: DrizzleProduct): PlantDetailResult {
    const thumbnail = product.thumbnail
      ? { id: product.thumbnail.id, url: product.thumbnail.url }
      : null;

    const translations = product.translations.map((t) => ({
      locale: t.locale,
      name: t.name,
      description: t.description,
      shortDescription: t.shortDescription,
    }));

    const plantDetails = product.plantDetails
      ? this.mapPlantDetails(product.plantDetails)
      : null;

    const careInstructions = product.careInstructions
      ? this.mapCareInstructions(product.careInstructions)
      : null;

    const variants = product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      inventoryCount: v.inventoryCount ?? DEFAULT_INVENTORY_COUNT,
      trackInventory: v.trackInventory,
      lowStockThreshold: v.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
      displayOrder: v.displayOrder,
      isBase: v.isBase,
      isActive: v.isActive,
      plantAttributes: v.plantAttributes
        ? {
            id: v.plantAttributes.id,
            growthStage: v.plantAttributes.growthStage,
            plantForm: v.plantAttributes.plantForm,
            variegation: v.plantAttributes.variegation,
            leafDensity: v.plantAttributes.leafDensity,
            stemCount: v.plantAttributes.stemCount ?? DEFAULT_STEM_COUNT,
            currentHeight: v.plantAttributes.currentHeight,
            currentSpread: v.plantAttributes.currentSpread,
            propagationType: v.plantAttributes.propagationType,
            containerType: v.plantAttributes.containerType,
            containerSize: v.plantAttributes.containerSize,
            bundleType: v.plantAttributes.bundleType,
          }
        : null,
      translations: v.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
      })),
      media: v.media
        .filter(
          (m): m is typeof m & { media: NonNullable<typeof m.media> } =>
            m.media != null,
        )
        .map((m) => ({
          id: m.id,
          mediaId: m.mediaId,
          displayOrder: m.displayOrder,
          type: m.type,
          url: m.media.url,
        })),
    }));

    return {
      id: product.id,
      slug: product.slug,
      status: product.status,
      thumbnail,
      translations,
      plantDetails,
      careInstructions,
      variants,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private mapPlantDetails(
    details: NonNullable<DrizzleProduct['plantDetails']>,
  ): PlantDetailResult['plantDetails'] {
    const category = details.category
      ? {
          id: details.category.id,
          slug: details.category.slug,
          translations: details.category.translations.map((t) => ({
            locale: t.locale,
            name: t.name,
          })),
        }
      : null;

    const tags = details.tags
      .filter(
        (pt): pt is typeof pt & { tag: NonNullable<typeof pt.tag> } =>
          pt.tag != null,
      )
      .map((pt) => ({
        id: pt.tag.id,
        slug: pt.tag.slug,
        translations: pt.tag.translations.map((t) => ({
          locale: t.locale,
          name: t.name,
        })),
      }));

    const translations = details.translations.map((t) => ({
      locale: t.locale,
      commonNames: t.commonNames,
      origin: t.origin,
      soilType: t.soilType,
      toxicityInfo: t.toxicityInfo,
    }));

    return {
      id: details.id,
      categoryId: details.categoryId,
      scientificName: details.scientificName,
      commonNames: details.commonNames,
      origin: details.origin,
      lightRequirement: details.lightRequirement,
      wateringFrequency: details.wateringFrequency,
      humidityLevel: details.humidityLevel,
      temperatureRange: details.temperatureRange,
      soilType: details.soilType,
      careDifficulty: details.careDifficulty,
      growthRate: details.growthRate,
      matureHeight: details.matureHeight,
      matureSpread: details.matureSpread,
      toxicityInfo: details.toxicityInfo,
      category,
      tags,
      translations,
    };
  }

  private mapCareInstructions(
    care: NonNullable<DrizzleProduct['careInstructions']>,
  ): PlantDetailResult['careInstructions'] {
    const translations = care.translations.map((t) => ({
      locale: t.locale,
      lightInstructions: t.lightInstructions,
      wateringInstructions: t.wateringInstructions,
      humidityInstructions: t.humidityInstructions,
      fertilizerSchedule: t.fertilizerSchedule,
      repottingFrequency: t.repottingFrequency,
      pruningNotes: t.pruningNotes,
      commonProblems: t.commonProblems,
      seasonalCare: t.seasonalCare,
    }));

    return {
      id: care.id,
      lightInstructions: care.lightInstructions,
      wateringInstructions: care.wateringInstructions,
      humidityInstructions: care.humidityInstructions,
      fertilizerSchedule: care.fertilizerSchedule,
      repottingFrequency: care.repottingFrequency,
      pruningNotes: care.pruningNotes,
      commonProblems: care.commonProblems,
      seasonalCare: care.seasonalCare,
      translations,
    };
  }
}
