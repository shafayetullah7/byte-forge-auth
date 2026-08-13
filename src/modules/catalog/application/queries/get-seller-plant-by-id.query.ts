import { HttpStatus, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productsTable } from '@/_db/drizzle/schema';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { ShopQueryService } from '@/modules/shop/application/queries';
import { mapVariantStockToApi } from '../../mappers/variant-stock.mapper';
import {
  loadVariantInventorySettings,
  resolveVariantInventorySettings,
} from '@/libs/inventory/variant-inventory-settings.loader';

const DEFAULT_STEM_COUNT = 0;

type PlantDetailsLocalizedText = {
  commonNames: string | null;
  origin: string | null;
  soilType: string | null;
  toxicityInfo: string | null;
};

type CareInstructionsLocalizedText = {
  lightInstructions: string | null;
  wateringInstructions: string | null;
  humidityInstructions: string | null;
  fertilizerSchedule: string | null;
  repottingFrequency: string | null;
  pruningNotes: string | null;
  commonProblems: string | null;
  seasonalCare: string | null;
};

type LocalePair<T> = {
  en: T;
  bn: T;
};

export type PlantDetailResult = {
  id: string;
  slug: string;
  status: string;
  thumbnail: { id: string; url: string } | null;
  translations: LocalePair<{
    name: string;
    description: string | null;
    shortDescription: string | null;
  }>;
  plantDetails: {
    id: string;
    categoryId: string | null;
    scientificName: string | null;
    lightRequirement: string | null;
    wateringFrequency: string | null;
    humidityLevel: string | null;
    temperatureRange: string | null;
    careDifficulty: string | null;
    growthRate: string | null;
    matureHeight: string | null;
    matureSpread: string | null;
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
    translations: LocalePair<PlantDetailsLocalizedText>;
  } | null;
  careInstructions: {
    id: string;
    translations: LocalePair<CareInstructionsLocalizedText>;
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
    translations: LocalePair<{ title: string }>;
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
    const inventorySettings = await loadVariantInventorySettings(
      this.db,
      product.variants.map((v) => v.id),
    );
    return this.mapResult(product, inventorySettings);
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

  private mapResult(
    product: DrizzleProduct,
    inventorySettings: Awaited<ReturnType<typeof loadVariantInventorySettings>>,
  ): PlantDetailResult {
    const thumbnail = product.thumbnail
      ? { id: product.thumbnail.id, url: product.thumbnail.url }
      : null;

    const translations = this.mapProductTranslations(product.translations);

    const plantDetails = product.plantDetails
      ? this.mapPlantDetails(product.plantDetails)
      : null;

    const careInstructions = product.careInstructions
      ? this.mapCareInstructions(product.careInstructions)
      : null;

    const variants = product.variants.map((v) => {
      const stock = mapVariantStockToApi(v.availableQuantity, v.stockStatus);
      const settings = resolveVariantInventorySettings(inventorySettings, v.id);
      return {
        id: v.id,
        sku: v.sku,
        price: v.price,
        inventoryCount: stock.inventoryCount,
        trackInventory: settings.trackInventory,
        lowStockThreshold: settings.lowStockThreshold,
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
      translations: this.mapVariantTranslations(v.translations),
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
      };
    });

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

  private mapProductTranslations(
    translations: DrizzleProduct['translations'],
  ): PlantDetailResult['translations'] {
    const en = translations.find((t) => t.locale === 'en');
    const bn = translations.find((t) => t.locale === 'bn');

    return {
      en: {
        name: en?.name ?? '',
        description: en?.description ?? null,
        shortDescription: en?.shortDescription ?? null,
      },
      bn: {
        name: bn?.name ?? '',
        description: bn?.description ?? null,
        shortDescription: bn?.shortDescription ?? null,
      },
    };
  }

  private mapVariantTranslations(
    translations: DrizzleProduct['variants'][number]['translations'],
  ): PlantDetailResult['variants'][number]['translations'] {
    const en = translations.find((t) => t.locale === 'en');
    const bn = translations.find((t) => t.locale === 'bn');

    return {
      en: { title: en?.title ?? '' },
      bn: { title: bn?.title ?? '' },
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

    const bnTranslation = details.translations.find((t) => t.locale === 'bn');

    const translations: LocalePair<PlantDetailsLocalizedText> = {
      en: {
        commonNames: details.commonNames,
        origin: details.origin,
        soilType: details.soilType,
        toxicityInfo: details.toxicityInfo,
      },
      bn: {
        commonNames: bnTranslation?.commonNames ?? null,
        origin: bnTranslation?.origin ?? null,
        soilType: bnTranslation?.soilType ?? null,
        toxicityInfo: bnTranslation?.toxicityInfo ?? null,
      },
    };

    return {
      id: details.id,
      categoryId: details.categoryId,
      scientificName: details.scientificName,
      lightRequirement: details.lightRequirement,
      wateringFrequency: details.wateringFrequency,
      humidityLevel: details.humidityLevel,
      temperatureRange: details.temperatureRange,
      careDifficulty: details.careDifficulty,
      growthRate: details.growthRate,
      matureHeight: details.matureHeight,
      matureSpread: details.matureSpread,
      category,
      tags,
      translations,
    };
  }

  private mapCareInstructions(
    care: NonNullable<DrizzleProduct['careInstructions']>,
  ): PlantDetailResult['careInstructions'] {
    const bnTranslation = care.translations.find((t) => t.locale === 'bn');

    return {
      id: care.id,
      translations: {
        en: {
          lightInstructions: care.lightInstructions,
          wateringInstructions: care.wateringInstructions,
          humidityInstructions: care.humidityInstructions,
          fertilizerSchedule: care.fertilizerSchedule,
          repottingFrequency: care.repottingFrequency,
          pruningNotes: care.pruningNotes,
          commonProblems: care.commonProblems,
          seasonalCare: care.seasonalCare,
        },
        bn: {
          lightInstructions: bnTranslation?.lightInstructions ?? null,
          wateringInstructions: bnTranslation?.wateringInstructions ?? null,
          humidityInstructions: bnTranslation?.humidityInstructions ?? null,
          fertilizerSchedule: bnTranslation?.fertilizerSchedule ?? null,
          repottingFrequency: bnTranslation?.repottingFrequency ?? null,
          pruningNotes: bnTranslation?.pruningNotes ?? null,
          commonProblems: bnTranslation?.commonProblems ?? null,
          seasonalCare: bnTranslation?.seasonalCare ?? null,
        },
      },
    };
  }
}
