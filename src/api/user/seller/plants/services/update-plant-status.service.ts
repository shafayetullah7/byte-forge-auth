import { Injectable, HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  productsTable,
  plantDetailsTable,
  productTranslationsTable,
  productVariantsTable,
} from '@/_db/drizzle/schema';
import { ProductStatusEnum, TProductStatus } from '@/_db/drizzle/enum';
import { CategoryRepository } from '@/modules/catalog/repositories';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { DrizzleTx } from '@/_db/drizzle/types';
import { GetPlantByIdService } from './get-plant-by-id.service';

@Injectable()
export class UpdatePlantStatusService {
  constructor(
    private readonly db: DrizzleService,
    private readonly categoryRepository: CategoryRepository,
    private readonly getPlantByIdService: GetPlantByIdService,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    shopId: string,
    plantId: string,
    targetStatus: TProductStatus,
    lang: string,
  ) {
    return this.db.transaction(async (tx) => {
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

      if (product.status === targetStatus) {
        return this.getPlantByIdService.execute(shopId, plantId);
      }

      if (targetStatus === ProductStatusEnum.ACTIVE) {
        await this.assertPublishReady(plantId, product.thumbnailId, tx, lang);
      }

      await tx
        .update(productsTable)
        .set({ status: targetStatus })
        .where(eq(productsTable.id, plantId));

      return this.getPlantByIdService.execute(shopId, plantId);
    });
  }

  async assertPublishReady(
    productId: string,
    thumbnailId: string | null,
    tx: DrizzleTx,
    lang: string,
  ) {
    const errors: Array<{ field: string; message: string }> = [];

    if (!thumbnailId) {
      errors.push({
        field: 'thumbnailId',
        message: 'Thumbnail is required to publish',
      });
    }

    const enTranslation = await tx.query.productTranslationsTable.findFirst({
      where: and(
        eq(productTranslationsTable.productId, productId),
        eq(productTranslationsTable.locale, 'en'),
      ),
    });

    if (!enTranslation?.name?.trim()) {
      errors.push({
        field: 'translations.en.name',
        message: 'English name is required to publish',
      });
    }

    const details = await tx.query.plantDetailsTable.findFirst({
      where: eq(plantDetailsTable.productId, productId),
    });

    if (!details?.categoryId) {
      errors.push({
        field: 'plantDetails.categoryId',
        message: 'Category is required to publish',
      });
    } else {
      const category = await this.categoryRepository.findOne(
        details.categoryId,
        { tx, lock: false },
      );
      if (!category || !category.isActive) {
        errors.push({
          field: 'plantDetails.categoryId',
          message: 'An active category is required to publish',
        });
      }
    }

    const activeVariants = await tx.query.productVariantsTable.findMany({
      where: and(
        eq(productVariantsTable.productId, productId),
        eq(productVariantsTable.isActive, true),
      ),
    });

    const hasPricedVariant = activeVariants.some(
      (v) => parseFloat(v.price) > 0,
    );

    if (!hasPricedVariant) {
      errors.push({
        field: 'variants',
        message:
          'At least one active variant with price greater than 0 is required',
      });
    }

    if (errors.length > 0) {
      throw new CustomException({
        message: this.i18n.t('message.error.plantNotPublishable', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
        validationErrors: errors,
      });
    }
  }
}
