import { HttpStatus, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { I18nService } from 'nestjs-i18n';
import {
  plantDetailsTable,
  productTranslationsTable,
  productVariantsTable,
} from '@/_db/drizzle/schema';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import type { DrizzleTx } from '@/libs/db/types';
import { CategoryRepository } from '../repositories/category.repository';

@Injectable()
export class PlantPublishValidator {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly i18n: I18nService,
  ) {}

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
        {
          tx,
          lock: false,
        },
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
