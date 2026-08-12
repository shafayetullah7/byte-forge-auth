import { Injectable, HttpStatus } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { DrizzleTx } from '@/libs/db/types';
import { MediaRepository } from '@/modules/media/repositories/media.repository';
import { CategoryRepository } from '@/modules/catalog/repositories';
import { TagRepository } from '@/modules/catalog/repositories';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { CreatePlantDto } from '../../controllers/dto/create-plant.dto';
import { ProductStatusEnum, TProductStatus } from '@/_db/drizzle/enum';
import { InventoryMovementTypeEnum } from '@/_db/drizzle/enum/inventory-movement-type.enum';
import { InventoryRepository } from '@/modules/inventory/repositories/inventory.repository';
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
  TNewProduct,
  TNewProductTranslation,
  TNewPlantDetails,
  TNewPlantDetailsTranslation,
  TNewPlantCareInstructions,
  TNewPlantCareTranslation,
  TNewProductVariant,
  TNewPlantVariantAttributes,
  TNewProductMedia,
  TNewPlantDetailsTags,
  TNewProductVariantTranslation,
} from '@/_db/drizzle/schema';
import { eq, like } from 'drizzle-orm';

@Injectable()
export class CreatePlantCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly mediaRepository: MediaRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    shopId: string,
    userId: string,
    dto: CreatePlantDto,
    lang: string,
  ) {
    return this.db.transaction(async (tx) => {
      // === 1. Validate media duplicates FIRST (fail fast) ===
      this.validateMediaDuplicates(dto, lang);

      // === 3. Collect and validate ALL media IDs ===
      const allMediaIds = this.collectAllMediaIds(dto);
      await this.validateMediaOwnership(allMediaIds, userId, tx, lang);

      // === 4. Validate variant SKUs ===
      this.validateVariantSkus(dto.variants, lang);

      // === 5. Run independent validations in parallel ===
      await Promise.all([
        this.validateCategory(dto.plantDetails.categoryId, tx, lang),
        dto.plantDetails.tagIds && dto.plantDetails.tagIds.length > 0
          ? this.validateTags(dto.plantDetails.tagIds, tx, lang)
          : Promise.resolve(),
      ]);

      // === 6. Resolve slug (validate or generate) ===
      const slug = dto.slug
        ? await this.validateAndReturnSlug(dto.slug, tx, lang)
        : await this.generateUniqueSlug(
            dto.translations.find((t) => t.locale === 'en')?.name || 'plant',
            tx,
          );

      // === 7. Create product ===
      const product = await this.createProductRecord(
        {
          shopId,
          productType: 'plant',
          slug,
          thumbnailId: dto.thumbnailId,
          status: (dto.status || ProductStatusEnum.DRAFT) as TProductStatus,
        },
        tx,
      );

      // === 8. Create product translations (BATCH) ===
      if (dto.translations && dto.translations.length > 0) {
        await this.createProductTranslations(product.id, dto.translations, tx);
      }

      // === 9. Create plant details (EN + Shared) ===
      const plantDetails = await this.createPlantDetails(
        product.id,
        dto.plantDetails,
        tx,
      );

      // === 10. Create plant details translations ===
      await this.createPlantDetailsTranslations(
        plantDetails.id,
        dto.plantDetails.translations.bn,
        tx,
      );

      // === 11. Create care instructions ===
      if (dto.careGuide) {
        const care = await this.createCareInstructions(
          product.id,
          dto.careGuide.en,
          tx,
        );

        if (dto.careGuide.bn) {
          await this.createCareTranslation(care.id, dto.careGuide.bn, tx);
        }
      }

      // === 12. Create variants (BATCH) ===
      const variants = await this.createVariants(product.id, dto.variants, tx);

      // === 12.25. Seed inventory records for variants ===
      await this.seedInitialInventory(
        shopId,
        userId,
        variants,
        dto.variants,
        tx,
      );

      // === 12.5. Create variant translations (BATCH) ===
      await this.createVariantTranslations(variants, dto, tx);

      // === 13. Create product media (BATCH - single insert) ===
      await this.createProductMedia(product.id, variants, dto, tx);

      // === 14. Create plant detail tags (BATCH) ===
      if (dto.plantDetails.tagIds && dto.plantDetails.tagIds.length > 0) {
        await this.createPlantDetailTags(
          plantDetails.id,
          dto.plantDetails.tagIds,
          tx,
        );
      }

      // === 15. Increment media usage counts (BATCH - single update) ===
      await this.mediaRepository.incrementMediaUsage(allMediaIds, tx);

      // === 16. Increment category usage count ===
      await this.categoryRepository.incrementUsageCount(
        dto.plantDetails.categoryId,
        1,
        tx,
      );

      // === 17. Increment tag usage counts (BATCH) ===
      if (dto.plantDetails.tagIds && dto.plantDetails.tagIds.length > 0) {
        await this.tagRepository.incrementUsageCountBatch(
          dto.plantDetails.tagIds,
          1,
          tx,
        );
      }

      // === 18. Return product ID (controller can fetch complete data if needed) ===
      return { id: product.id };
    });
  }

  // === Validation Methods ===

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
      const foundIds = new Set(tags.map((t) => t.id));
      const invalidIds = tagIds.filter((id) => !foundIds.has(id));
      throw new CustomException({
        message: this.i18n.t('message.error.invalidTags', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
        validationErrors: invalidIds.map((id) => ({
          field: 'tagIds',
          message: `Tag ${id} does not exist`,
        })),
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

  private async validateAndReturnSlug(
    slug: string,
    tx: DrizzleTx,
    lang: string,
  ): Promise<string> {
    const existing = await tx.query.productsTable.findFirst({
      where: eq(productsTable.slug, slug),
    });

    if (existing) {
      throw new CustomException({
        message: this.i18n.t('message.error.slugTaken', { lang }),
        statusCode: HttpStatus.CONFLICT,
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      });
    }

    return slug;
  }

  private validateVariantSkus(
    variants: CreatePlantDto['variants'],
    lang: string,
  ) {
    const skus = variants.map((v) => v.sku).filter(Boolean);
    const uniqueSkus = new Set(skus);

    if (skus.length !== uniqueSkus.size) {
      throw new CustomException({
        message: this.i18n.t('message.error.duplicateSkuInVariants', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
        validationErrors: [
          {
            field: 'variants.sku',
            message: this.i18n.t('message.error.duplicateSkuInVariants', {
              lang,
            }),
          },
        ],
      });
    }
  }

  private validateMediaDuplicates(dto: CreatePlantDto, lang: string) {
    const allMediaIds = this.extractMediaIds(dto);

    const uniqueMediaIds = new Set(allMediaIds);
    if (allMediaIds.length !== uniqueMediaIds.size) {
      throw new CustomException({
        message: this.i18n.t('message.error.duplicateMediaIds', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
        validationErrors: [
          {
            field: 'mediaIds',
            message: this.i18n.t('message.error.duplicateMediaIds', { lang }),
          },
        ],
      });
    }
  }

  private extractMediaIds(dto: CreatePlantDto): string[] {
    return [
      dto.thumbnailId,
      ...dto.variants.flatMap((v) => v.mediaIds ?? []),
    ].filter(Boolean);
  }

  private collectAllMediaIds(dto: CreatePlantDto): string[] {
    return this.extractMediaIds(dto);
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
        validationErrors: existenceCheck.invalidIds.map((id) => ({
          field: 'mediaIds',
          message: `Media ${id} does not exist`,
        })),
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

  private async generateUniqueSlug(
    baseName: string,
    tx: DrizzleTx,
  ): Promise<string> {
    const base = this.generateSlug(baseName);

    const existing = await tx.query.productsTable.findMany({
      where: like(productsTable.slug, `${base}%`),
      columns: { slug: true },
    });

    if (existing.length === 0) return base;

    const existingSlugs = new Set(existing.map((r) => r.slug));
    if (!existingSlugs.has(base)) return base;

    let counter = 2;
    while (existingSlugs.has(`${base}-${counter}`)) counter++;
    return `${base}-${counter}`;
  }

  private async seedInitialInventory(
    shopId: string,
    userId: string,
    createdVariants: Awaited<ReturnType<typeof this.createVariants>>,
    variantDtos: CreatePlantDto['variants'],
    tx: DrizzleTx,
  ) {
    for (let i = 0; i < createdVariants.length; i++) {
      const variant = createdVariants[i];
      const dto = variantDtos[i];
      const initialCount = dto.inventoryCount ?? 0;
      const lowStockThreshold = dto.lowStockThreshold ?? 5;

      const inventory = await this.inventoryRepository.getOrCreateInventory(
        variant.id,
        shopId,
        tx,
        lowStockThreshold,
      );

      if (initialCount > 0) {
        await this.inventoryRepository.update(
          inventory.id,
          { quantity: initialCount },
          tx,
        );

        await this.inventoryRepository.createMovement(
          {
            inventoryId: inventory.id,
            shopId,
            movementType: InventoryMovementTypeEnum.INITIAL_STOCK,
            quantityChange: initialCount,
            previousQuantity: 0,
            newQuantity: initialCount,
            previousReserved: 0,
            newReserved: 0,
            referenceType: 'plant_create',
            referenceId: variant.id,
            reason: 'Initial stock on plant creation',
            createdBy: userId,
          },
          tx,
        );
      }
    }
  }

  // === Creation Methods (BATCH Operations) ===

  private async createProductRecord(payload: TNewProduct, tx: DrizzleTx) {
    const [product] = await tx
      .insert(productsTable)
      .values(payload)
      .returning();
    return product;
  }

  private async createProductTranslations(
    productId: string,
    translations: CreatePlantDto['translations'],
    tx: DrizzleTx,
  ) {
    const payloads: TNewProductTranslation[] = translations.map((t) => ({
      productId,
      locale: t.locale,
      name: t.name,
      description: t.description,
      shortDescription: t.shortDescription || null,
    }));

    await tx.insert(productTranslationsTable).values(payloads);
  }

  private async createPlantDetails(
    productId: string,
    details: CreatePlantDto['plantDetails'],
    tx: DrizzleTx,
  ) {
    const payload: TNewPlantDetails = {
      productId,
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

    const [plantDetails] = await tx
      .insert(plantDetailsTable)
      .values(payload)
      .returning();
    return plantDetails;
  }

  private async createPlantDetailsTranslations(
    plantDetailsId: string,
    bnDetails: CreatePlantDto['plantDetails']['translations']['bn'],
    tx: DrizzleTx,
  ) {
    const payload: TNewPlantDetailsTranslation = {
      plantId: plantDetailsId,
      locale: 'bn',
      commonNames: bnDetails.commonNames || null,
      origin: bnDetails.origin || null,
      soilType: bnDetails.soilType || null,
      toxicityInfo: bnDetails.toxicityInfo || null,
    };

    await tx.insert(plantDetailsTranslationsTable).values(payload);
  }

  private async createCareInstructions(
    productId: string,
    instructions: NonNullable<CreatePlantDto['careGuide']>['en'],
    tx: DrizzleTx,
  ) {
    const payload: TNewPlantCareInstructions = {
      productId,
      lightInstructions: instructions?.lightInstructions || null,
      wateringInstructions: instructions?.wateringInstructions || null,
      humidityInstructions: instructions?.humidityInstructions || null,
      fertilizerSchedule: instructions?.fertilizerSchedule || null,
      repottingFrequency: instructions?.repottingFrequency || null,
      pruningNotes: instructions?.pruningNotes || null,
      commonProblems: instructions?.commonProblems || null,
      seasonalCare: instructions?.seasonalCare || null,
    };

    const [care] = await tx
      .insert(plantCareInstructionsTable)
      .values(payload)
      .returning();
    return care;
  }

  private async createCareTranslation(
    careId: string,
    bnCare: NonNullable<CreatePlantDto['careGuide']>['bn'],
    tx: DrizzleTx,
  ) {
    const payload: TNewPlantCareTranslation = {
      careId,
      locale: 'bn',
      lightInstructions: bnCare?.lightInstructions || null,
      wateringInstructions: bnCare?.wateringInstructions || null,
      humidityInstructions: bnCare?.humidityInstructions || null,
      fertilizerSchedule: bnCare?.fertilizerSchedule || null,
      repottingFrequency: bnCare?.repottingFrequency || null,
      pruningNotes: bnCare?.pruningNotes || null,
      commonProblems: bnCare?.commonProblems || null,
      seasonalCare: bnCare?.seasonalCare || null,
    };

    await tx.insert(plantCareTranslationsTable).values(payload);
  }

  private async createVariants(
    productId: string,
    variants: CreatePlantDto['variants'],
    tx: DrizzleTx,
  ) {
    const variantPayloads: TNewProductVariant[] = variants.map((v, index) => ({
      productId,
      sku: v.sku || null,
      price: v.price.toString(),
      inventoryCount: v.inventoryCount ?? 0,
      trackInventory: v.trackInventory ?? true,
      lowStockThreshold: v.lowStockThreshold ?? 5,
      displayOrder: index,
      isBase: v.isBase ?? false,
      isActive: v.isActive ?? true,
    }));

    const createdVariants = await tx
      .insert(productVariantsTable)
      .values(variantPayloads)
      .returning();

    const attrPayloads: TNewPlantVariantAttributes[] = [];

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const createdVariant = createdVariants[i];

      if (variant.plantAttributes) {
        attrPayloads.push({
          variantId: createdVariant.id,
          growthStage: variant.plantAttributes.growthStage || undefined,
          plantForm: variant.plantAttributes.plantForm || undefined,
          variegation: variant.plantAttributes.variegation || undefined,
          leafDensity: variant.plantAttributes.leafDensity || undefined,
          stemCount: variant.plantAttributes.stemCount || undefined,
          currentHeight: variant.plantAttributes.currentHeight || null,
          currentSpread: variant.plantAttributes.currentSpread || null,
          propagationType: variant.plantAttributes.propagationType || undefined,
          containerType: variant.plantAttributes.containerType || undefined,
          containerSize: variant.plantAttributes.containerSize || null,
          bundleType: variant.plantAttributes.bundleType || null,
        });
      }
    }

    if (attrPayloads.length > 0) {
      await tx.insert(plantVariantAttributesTable).values(attrPayloads);
    }

    return createdVariants;
  }

  private async createProductMedia(
    productId: string,
    variants: Awaited<ReturnType<typeof this.createVariants>>,
    dto: CreatePlantDto,
    tx: DrizzleTx,
  ) {
    const mediaPayloads: TNewProductMedia[] = [];

    mediaPayloads.push({
      productId,
      variantId: null,
      mediaId: dto.thumbnailId,
      displayOrder: -1,
      type: 'image',
    });

    variants.forEach((variant, variantIndex) => {
      const variantDto = dto.variants[variantIndex];
      if (variantDto.mediaIds && variantDto.mediaIds.length > 0) {
        variantDto.mediaIds.forEach((mediaId: string, mediaIndex: number) => {
          mediaPayloads.push({
            productId,
            variantId: variant.id,
            mediaId,
            displayOrder: mediaIndex,
            type: 'image',
          });
        });
      }
    });

    if (mediaPayloads.length > 0) {
      await tx.insert(productMediaTable).values(mediaPayloads);
    }
  }

  private async createVariantTranslations(
    variants: Awaited<ReturnType<typeof this.createVariants>>,
    dto: CreatePlantDto,
    tx: DrizzleTx,
  ) {
    const payloads: TNewProductVariantTranslation[] = [];

    for (let i = 0; i < variants.length; i++) {
      const enTitle = dto.variants[i].translations.en.title?.trim();
      const bnTitle = dto.variants[i].translations.bn.title?.trim();
      if (enTitle)
        payloads.push({
          variantId: variants[i].id,
          locale: 'en',
          title: enTitle,
        });
      if (bnTitle)
        payloads.push({
          variantId: variants[i].id,
          locale: 'bn',
          title: bnTitle,
        });
    }

    if (payloads.length > 0) {
      await tx.insert(productVariantTranslationsTable).values(payloads);
    }
  }

  private async createPlantDetailTags(
    plantDetailsId: string,
    tagIds: string[],
    tx: DrizzleTx,
  ) {
    const payloads: TNewPlantDetailsTags[] = tagIds.map((tagId) => ({
      plantId: plantDetailsId,
      tagId,
    }));

    await tx.insert(plantDetailsTagsTable).values(payloads);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
