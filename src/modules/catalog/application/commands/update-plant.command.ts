import { Injectable, HttpStatus } from '@nestjs/common';
import { and, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { DrizzleTx } from '@/libs/db/types';
import { MediaRepository } from '@/_repositories/providers/media/media.repository/media.repository';
import { CategoryRepository } from '@/modules/catalog/repositories';
import { TagRepository } from '@/modules/catalog/repositories';
import { InventoryRepository } from '@/modules/inventory/repositories/inventory.repository';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { UpdatePlantDto } from '../../controllers/dto/update-plant.dto';
import { ProductStatusEnum, TProductStatus } from '@/_db/drizzle/enum';
import {
  TLightRequirement,
  TWateringFrequency,
  THumidityLevel,
  TCareDifficulty,
  TGrowthRate,
} from '@/_db/drizzle/enum/plant-care.enum';
import {
  productsTable,
  productTranslationsTable,
  plantDetailsTable,
  plantDetailsTranslationsTable,
  plantDetailsTagsTable,
  plantCareInstructionsTable,
  plantCareTranslationsTable,
  productVariantsTable,
  plantVariantAttributesTable,
  productMediaTable,
  productVariantTranslationsTable,
  orderItemsTable,
  TNewProductTranslation,
  TNewPlantDetailsTranslation,
  TNewPlantCareTranslation,
  TNewProductMedia,
  TNewProductVariantTranslation,
  TNewPlantDetailsTags,
  TNewPlantVariantAttributes,
} from '@/_db/drizzle/schema';
import { PlantPublishValidator } from '../plant-publish.validator';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class UpdatePlantCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly mediaRepository: MediaRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly plantPublishValidator: PlantPublishValidator,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    shopId: string,
    userId: string,
    plantId: string,
    dto: UpdatePlantDto,
    lang: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const product = await tx.query.productsTable.findFirst({
        where: and(
          eq(productsTable.id, plantId),
          eq(productsTable.shopId, shopId),
          eq(productsTable.productType, 'plant'),
        ),
      });

      if (!product) {
        throw new CustomException({
          message: this.i18n.t('message.error.plantNotFound', { lang }),
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCode.NOT_FOUND,
        });
      }

      this.validateMediaDuplicates(dto, lang);
      const allMediaIds = this.collectAllMediaIds(dto);
      await this.validateMediaOwnership(allMediaIds, userId, tx, lang);

      await Promise.all([
        this.validateCategory(dto.plantDetails.categoryId, tx, lang),
        dto.plantDetails.tagIds && dto.plantDetails.tagIds.length > 0
          ? this.validateTags(dto.plantDetails.tagIds, tx, lang)
          : Promise.resolve(),
      ]);

      const resolvedSlug = dto.slug ?? product.slug;
      const resolvedThumbnailId = dto.thumbnailId ?? product.thumbnailId;

      await this.validateSlugGlobally(resolvedSlug, plantId, tx, lang);
      this.validateVariantSkusInPayload(dto.variants, lang);
      await this.validateSkusGlobally(dto.variants, tx, lang);

      const previousMediaIds = await this.getProductMediaIds(plantId, tx);
      const plantDetailsRow = await tx.query.plantDetailsTable.findFirst({
        where: eq(plantDetailsTable.productId, plantId),
      });
      const previousCategoryId = plantDetailsRow?.categoryId ?? null;
      const previousTagIds = plantDetailsRow
        ? (
            await tx.query.plantDetailsTagsTable.findMany({
              where: eq(plantDetailsTagsTable.plantId, plantDetailsRow.id),
            })
          ).map((t) => t.tagId)
        : [];

      const nextStatus = (dto.status ?? product.status) as TProductStatus;

      await tx
        .update(productsTable)
        .set({
          slug: resolvedSlug,
          thumbnailId: resolvedThumbnailId,
          status: nextStatus,
        })
        .where(eq(productsTable.id, plantId));

      if (
        nextStatus === ProductStatusEnum.ACTIVE &&
        product.status !== ProductStatusEnum.ACTIVE
      ) {
        await this.plantPublishValidator.assertPublishReady(
          plantId,
          resolvedThumbnailId,
          tx,
          lang,
        );
      }

      await this.replaceProductTranslations(plantId, dto.translations, tx);
      const detailsId = await this.updatePlantDetails(
        plantId,
        plantDetailsRow?.id,
        dto.plantDetails,
        tx,
      );
      await this.upsertCareGuide(plantId, dto.careGuide, tx);
      await this.syncTags(
        detailsId,
        previousTagIds,
        dto.plantDetails.tagIds ?? [],
        tx,
      );

      if (
        previousCategoryId &&
        previousCategoryId !== dto.plantDetails.categoryId
      ) {
        await this.categoryRepository.decrementUsageCount(
          previousCategoryId,
          1,
          tx,
        );
        await this.categoryRepository.incrementUsageCount(
          dto.plantDetails.categoryId,
          1,
          tx,
        );
      } else if (!previousCategoryId) {
        await this.categoryRepository.incrementUsageCount(
          dto.plantDetails.categoryId,
          1,
          tx,
        );
      }

      await this.syncVariants(shopId, plantId, dto, tx, lang);
      if (resolvedThumbnailId) {
        await this.syncThumbnailMedia(plantId, resolvedThumbnailId, tx);
      }
      await this.syncMediaUsage(previousMediaIds, allMediaIds, tx);
    });
  }

  private isServerVariantId(id?: string): id is string {
    return !!id && UUID_REGEX.test(id);
  }

  private async syncVariants(
    shopId: string,
    productId: string,
    dto: UpdatePlantDto,
    tx: DrizzleTx,
    lang: string,
  ) {
    const existingVariants = await tx.query.productVariantsTable.findMany({
      where: eq(productVariantsTable.productId, productId),
    });
    const existingById = new Map(existingVariants.map((v) => [v.id, v]));
    const payloadServerIds = new Set(
      dto.variants
        .map((v) => v.id)
        .filter((id): id is string => this.isServerVariantId(id)),
    );

    for (let index = 0; index < dto.variants.length; index++) {
      const variantDto = dto.variants[index];
      if (this.isServerVariantId(variantDto.id)) {
        const existing = existingById.get(variantDto.id);
        if (!existing) {
          throw new CustomException({
            message: this.i18n.t('message.error.variantNotFound', { lang }),
            statusCode: HttpStatus.BAD_REQUEST,
            errorCode: ErrorCode.VALIDATION_ERROR,
          });
        }
        await this.updateExistingVariant(
          productId,
          variantDto.id,
          variantDto,
          index,
          tx,
        );
      } else {
        await this.insertNewVariant(shopId, productId, variantDto, index, tx);
      }
    }

    for (const existing of existingVariants) {
      if (payloadServerIds.has(existing.id)) continue;

      const [orderRow] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(orderItemsTable)
        .where(eq(orderItemsTable.variantId, existing.id));

      if ((orderRow?.count ?? 0) > 0) {
        await tx
          .update(productVariantsTable)
          .set({ isActive: false })
          .where(eq(productVariantsTable.id, existing.id));
      } else {
        await tx
          .delete(productVariantsTable)
          .where(eq(productVariantsTable.id, existing.id));
      }
    }
  }

  private async updateExistingVariant(
    productId: string,
    variantId: string,
    variantDto: UpdatePlantDto['variants'][number],
    displayOrder: number,
    tx: DrizzleTx,
  ) {
    await tx
      .update(productVariantsTable)
      .set({
        sku: variantDto.sku || null,
        price: variantDto.price.toString(),
        displayOrder,
        isBase: variantDto.isBase ?? false,
        isActive: variantDto.isActive ?? true,
      })
      .where(
        and(
          eq(productVariantsTable.id, variantId),
          eq(productVariantsTable.productId, productId),
        ),
      );

    const attrs = variantDto.plantAttributes;
    const existingAttrs = await tx.query.plantVariantAttributesTable.findFirst({
      where: eq(plantVariantAttributesTable.variantId, variantId),
    });

    const attrPayload: TNewPlantVariantAttributes = {
      variantId,
      growthStage: attrs?.growthStage || undefined,
      plantForm: attrs?.plantForm || undefined,
      variegation: attrs?.variegation || undefined,
      leafDensity: attrs?.leafDensity || undefined,
      stemCount: attrs?.stemCount || undefined,
      currentHeight: attrs?.currentHeight || null,
      currentSpread: attrs?.currentSpread || null,
      propagationType: attrs?.propagationType || undefined,
      containerType: attrs?.containerType || undefined,
      containerSize: attrs?.containerSize || null,
      bundleType: attrs?.bundleType || null,
    };

    if (existingAttrs) {
      await tx
        .update(plantVariantAttributesTable)
        .set(attrPayload)
        .where(eq(plantVariantAttributesTable.variantId, variantId));
    } else if (attrs) {
      await tx.insert(plantVariantAttributesTable).values(attrPayload);
    }

    await tx
      .delete(productVariantTranslationsTable)
      .where(eq(productVariantTranslationsTable.variantId, variantId));

    const translationPayloads: TNewProductVariantTranslation[] = [];
    const enTitle = variantDto.translations.en.title?.trim();
    const bnTitle = variantDto.translations.bn.title?.trim();
    if (enTitle) {
      translationPayloads.push({ variantId, locale: 'en', title: enTitle });
    }
    if (bnTitle) {
      translationPayloads.push({ variantId, locale: 'bn', title: bnTitle });
    }
    if (translationPayloads.length > 0) {
      await tx
        .insert(productVariantTranslationsTable)
        .values(translationPayloads);
    }

    await tx
      .delete(productMediaTable)
      .where(
        and(
          eq(productMediaTable.productId, productId),
          eq(productMediaTable.variantId, variantId),
        ),
      );

    if (variantDto.mediaIds && variantDto.mediaIds.length > 0) {
      const mediaPayloads: TNewProductMedia[] = variantDto.mediaIds.map(
        (mediaId, mediaIndex) => ({
          productId,
          variantId,
          mediaId,
          displayOrder: mediaIndex,
          type: 'image' as const,
        }),
      );
      await tx.insert(productMediaTable).values(mediaPayloads);
    }
  }

  private async insertNewVariant(
    shopId: string,
    productId: string,
    variantDto: UpdatePlantDto['variants'][number],
    displayOrder: number,
    tx: DrizzleTx,
  ) {
    const [created] = await tx
      .insert(productVariantsTable)
      .values({
        productId,
        sku: variantDto.sku || null,
        price: variantDto.price.toString(),
        inventoryCount: 0,
        trackInventory: true,
        lowStockThreshold: 5,
        displayOrder,
        isBase: variantDto.isBase ?? false,
        isActive: variantDto.isActive ?? true,
      })
      .returning();

    if (variantDto.plantAttributes) {
      await tx.insert(plantVariantAttributesTable).values({
        variantId: created.id,
        growthStage: variantDto.plantAttributes.growthStage || undefined,
        plantForm: variantDto.plantAttributes.plantForm || undefined,
        variegation: variantDto.plantAttributes.variegation || undefined,
        leafDensity: variantDto.plantAttributes.leafDensity || undefined,
        stemCount: variantDto.plantAttributes.stemCount || undefined,
        currentHeight: variantDto.plantAttributes.currentHeight || null,
        currentSpread: variantDto.plantAttributes.currentSpread || null,
        propagationType:
          variantDto.plantAttributes.propagationType || undefined,
        containerType: variantDto.plantAttributes.containerType || undefined,
        containerSize: variantDto.plantAttributes.containerSize || null,
        bundleType: variantDto.plantAttributes.bundleType || null,
      });
    }

    const translationPayloads: TNewProductVariantTranslation[] = [];
    const enTitle = variantDto.translations.en.title?.trim();
    const bnTitle = variantDto.translations.bn.title?.trim();
    if (enTitle) {
      translationPayloads.push({
        variantId: created.id,
        locale: 'en',
        title: enTitle,
      });
    }
    if (bnTitle) {
      translationPayloads.push({
        variantId: created.id,
        locale: 'bn',
        title: bnTitle,
      });
    }
    if (translationPayloads.length > 0) {
      await tx
        .insert(productVariantTranslationsTable)
        .values(translationPayloads);
    }

    if (variantDto.mediaIds && variantDto.mediaIds.length > 0) {
      await tx.insert(productMediaTable).values(
        variantDto.mediaIds.map((mediaId, mediaIndex) => ({
          productId,
          variantId: created.id,
          mediaId,
          displayOrder: mediaIndex,
          type: 'image' as const,
        })),
      );
    }

    await this.inventoryRepository.getOrCreateInventory(
      created.id,
      shopId,
      tx,
      5,
    );
  }

  private async syncThumbnailMedia(
    productId: string,
    thumbnailId: string,
    tx: DrizzleTx,
  ) {
    const existingThumb = await tx.query.productMediaTable.findFirst({
      where: and(
        eq(productMediaTable.productId, productId),
        isNull(productMediaTable.variantId),
        eq(productMediaTable.displayOrder, -1),
      ),
    });

    if (existingThumb?.mediaId === thumbnailId) return;

    if (existingThumb) {
      await tx
        .delete(productMediaTable)
        .where(eq(productMediaTable.id, existingThumb.id));
    }

    await tx.insert(productMediaTable).values({
      productId,
      variantId: null,
      mediaId: thumbnailId,
      displayOrder: -1,
      type: 'image',
    });
  }

  private async getProductMediaIds(
    productId: string,
    tx: DrizzleTx,
  ): Promise<string[]> {
    const rows = await tx.query.productMediaTable.findMany({
      where: eq(productMediaTable.productId, productId),
      columns: { mediaId: true },
    });
    return rows.map((r) => r.mediaId);
  }

  private async syncMediaUsage(
    previousIds: string[],
    nextIds: string[],
    tx: DrizzleTx,
  ) {
    const prevSet = new Set(previousIds);
    const nextSet = new Set(nextIds);
    const toDecrement = previousIds.filter((id) => !nextSet.has(id));
    const toIncrement = nextIds.filter((id) => !prevSet.has(id));

    if (toDecrement.length > 0) {
      await this.mediaRepository.decrementMediaUsage(toDecrement, tx);
    }
    if (toIncrement.length > 0) {
      await this.mediaRepository.incrementMediaUsage(toIncrement, tx);
    }
  }

  private async replaceProductTranslations(
    productId: string,
    translations: UpdatePlantDto['translations'],
    tx: DrizzleTx,
  ) {
    await tx
      .delete(productTranslationsTable)
      .where(eq(productTranslationsTable.productId, productId));

    const payloads: TNewProductTranslation[] = translations.map((t) => ({
      productId,
      locale: t.locale,
      name: t.name,
      description: t.description,
      shortDescription: t.shortDescription || null,
    }));

    await tx.insert(productTranslationsTable).values(payloads);
  }

  private async updatePlantDetails(
    productId: string,
    plantDetailsId: string | undefined,
    details: UpdatePlantDto['plantDetails'],
    tx: DrizzleTx,
  ): Promise<string> {
    const payload = {
      categoryId: details.categoryId,
      scientificName: details.scientificName || null,
      commonNames: details.translations.en.commonNames || null,
      origin: details.translations.en.origin || null,
      lightRequirement: details.lightRequirement as TLightRequirement,
      wateringFrequency: details.wateringFrequency as TWateringFrequency,
      humidityLevel: details.humidityLevel as THumidityLevel,
      temperatureRange: details.temperatureRange || null,
      soilType: details.translations.en.soilType || null,
      careDifficulty: details.careDifficulty as TCareDifficulty,
      growthRate: details.growthRate as TGrowthRate,
      matureHeight: details.matureHeight || null,
      matureSpread: details.matureSpread || null,
      toxicityInfo: details.translations.en.toxicityInfo || null,
    };

    let resolvedId = plantDetailsId;
    if (plantDetailsId) {
      await tx
        .update(plantDetailsTable)
        .set(payload)
        .where(eq(plantDetailsTable.id, plantDetailsId));
    } else {
      const [created] = await tx
        .insert(plantDetailsTable)
        .values({ productId, ...payload })
        .returning({ id: plantDetailsTable.id });
      resolvedId = created.id;
    }

    await tx
      .delete(plantDetailsTranslationsTable)
      .where(
        and(
          eq(plantDetailsTranslationsTable.plantId, resolvedId!),
          eq(plantDetailsTranslationsTable.locale, 'bn'),
        ),
      );

    const bnPayload: TNewPlantDetailsTranslation = {
      plantId: resolvedId!,
      locale: 'bn',
      commonNames: details.translations.bn.commonNames || null,
      origin: details.translations.bn.origin || null,
      soilType: details.translations.bn.soilType || null,
      toxicityInfo: details.translations.bn.toxicityInfo || null,
    };
    await tx.insert(plantDetailsTranslationsTable).values(bnPayload);

    return resolvedId!;
  }

  private async upsertCareGuide(
    productId: string,
    careGuide: UpdatePlantDto['careGuide'],
    tx: DrizzleTx,
  ) {
    if (!careGuide) return;

    let care = await tx.query.plantCareInstructionsTable.findFirst({
      where: eq(plantCareInstructionsTable.productId, productId),
    });

    const en = careGuide.en;
    if (en) {
      const carePayload = {
        lightInstructions: en.lightInstructions || null,
        wateringInstructions: en.wateringInstructions || null,
        humidityInstructions: en.humidityInstructions || null,
        fertilizerSchedule: en.fertilizerSchedule || null,
        repottingFrequency: en.repottingFrequency || null,
        pruningNotes: en.pruningNotes || null,
        commonProblems: en.commonProblems || null,
        seasonalCare: en.seasonalCare || null,
      };

      if (care) {
        await tx
          .update(plantCareInstructionsTable)
          .set(carePayload)
          .where(eq(plantCareInstructionsTable.id, care.id));
      } else {
        const [created] = await tx
          .insert(plantCareInstructionsTable)
          .values({ productId, ...carePayload })
          .returning();
        care = created;
      }
    }

    if (!care) return;

    const bn = careGuide.bn;
    if (bn) {
      await tx
        .delete(plantCareTranslationsTable)
        .where(
          and(
            eq(plantCareTranslationsTable.careId, care.id),
            eq(plantCareTranslationsTable.locale, 'bn'),
          ),
        );

      const bnPayload: TNewPlantCareTranslation = {
        careId: care.id,
        locale: 'bn',
        lightInstructions: bn.lightInstructions || null,
        wateringInstructions: bn.wateringInstructions || null,
        humidityInstructions: bn.humidityInstructions || null,
        fertilizerSchedule: bn.fertilizerSchedule || null,
        repottingFrequency: bn.repottingFrequency || null,
        pruningNotes: bn.pruningNotes || null,
        commonProblems: bn.commonProblems || null,
        seasonalCare: bn.seasonalCare || null,
      };
      await tx.insert(plantCareTranslationsTable).values(bnPayload);
    }
  }

  private async syncTags(
    plantDetailsId: string,
    previousTagIds: string[],
    nextTagIds: string[],
    tx: DrizzleTx,
  ) {
    const prevSet = new Set(previousTagIds);
    const nextSet = new Set(nextTagIds);
    const toRemove = previousTagIds.filter((id) => !nextSet.has(id));
    const toAdd = nextTagIds.filter((id) => !prevSet.has(id));

    if (toRemove.length > 0) {
      await tx
        .delete(plantDetailsTagsTable)
        .where(
          and(
            eq(plantDetailsTagsTable.plantId, plantDetailsId),
            inArray(plantDetailsTagsTable.tagId, toRemove),
          ),
        );
      for (const tagId of toRemove) {
        await this.tagRepository.decrementUsageCount(tagId, 1, tx);
      }
    }

    if (toAdd.length > 0) {
      const payloads: TNewPlantDetailsTags[] = toAdd.map((tagId) => ({
        plantId: plantDetailsId,
        tagId,
      }));
      await tx.insert(plantDetailsTagsTable).values(payloads);
      await this.tagRepository.incrementUsageCountBatch(toAdd, 1, tx);
    }
  }

  private async validateSlugGlobally(
    slug: string,
    productId: string,
    tx: DrizzleTx,
    lang: string,
  ) {
    const existing = await tx.query.productsTable.findFirst({
      where: and(eq(productsTable.slug, slug), ne(productsTable.id, productId)),
    });

    if (existing) {
      throw new CustomException({
        message: this.i18n.t('message.error.slugTaken', { lang }),
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }
  }

  private validateVariantSkusInPayload(
    variants: UpdatePlantDto['variants'],
    lang: string,
  ) {
    const skus = variants.map((v) => v.sku).filter(Boolean) as string[];
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      throw new CustomException({
        message: this.i18n.t('message.error.duplicateSkuInVariants', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }
  }

  private async validateSkusGlobally(
    variants: UpdatePlantDto['variants'],
    tx: DrizzleTx,
    lang: string,
  ) {
    for (const variant of variants) {
      if (!variant.sku) continue;

      const conditions = [eq(productVariantsTable.sku, variant.sku)];
      if (this.isServerVariantId(variant.id)) {
        conditions.push(ne(productVariantsTable.id, variant.id));
      }

      const existing = await tx.query.productVariantsTable.findFirst({
        where: and(...conditions),
      });

      if (existing) {
        throw new CustomException({
          message: this.i18n.t('message.error.skuTaken', { lang }),
          statusCode: HttpStatus.CONFLICT,
          errorCode: ErrorCode.DUPLICATE_ENTRY,
        });
      }
    }
  }

  private validateMediaDuplicates(dto: UpdatePlantDto, lang: string) {
    const allMediaIds = this.collectAllMediaIds(dto);
    const uniqueMediaIds = new Set(allMediaIds);
    if (allMediaIds.length !== uniqueMediaIds.size) {
      throw new CustomException({
        message: this.i18n.t('message.error.duplicateMediaIds', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }
  }

  private collectAllMediaIds(dto: UpdatePlantDto): string[] {
    return [
      dto.thumbnailId,
      ...dto.variants.flatMap((v) => v.mediaIds ?? []),
    ].filter((id): id is string => Boolean(id));
  }

  private async validateCategory(
    categoryId: string,
    tx: DrizzleTx,
    lang: string,
  ) {
    const category = await this.categoryRepository.findOne(categoryId, {
      tx,
      lock: false,
    });

    if (!category) {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidCategory', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }

    if (!category.isActive) {
      throw new CustomException({
        message: this.i18n.t('message.error.categoryInactive', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }
  }

  private async validateTags(tagIds: string[], tx: DrizzleTx, lang: string) {
    const tags = await this.tagRepository.findByIds(tagIds, { tx, lock: true });

    if (tags.length !== tagIds.length) {
      throw new CustomException({
        message: this.i18n.t('message.error.invalidTags', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }

    const inactiveTags = tags.filter((t) => !t.isActive);
    if (inactiveTags.length > 0) {
      throw new CustomException({
        message: this.i18n.t('message.error.inactiveTags', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }
  }

  private async validateMediaOwnership(
    mediaIds: string[],
    userId: string,
    tx: DrizzleTx,
    lang: string,
  ) {
    if (mediaIds.length === 0) return;

    const existenceCheck = await this.mediaRepository.checkMediaExistence(
      mediaIds,
      tx,
    );
    if (!existenceCheck.valid) {
      throw new CustomException({
        message: this.i18n.t('message.error.mediaNotFound', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }

    const isOwner = await this.mediaRepository.verifyMediaOwnership(
      mediaIds,
      userId,
      tx,
    );
    if (!isOwner) {
      throw new CustomException({
        message: this.i18n.t('message.error.mediaNotOwned', { lang }),
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: ErrorCode.FORBIDDEN,
      });
    }
  }
}
