import { Injectable, HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productsTable } from '@/_db/drizzle/schema';
import { ProductStatusEnum, TProductStatus } from '@/_db/drizzle/enum';
import { PlantPublishValidator } from '@/modules/catalog/application/plant-publish.validator';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { GetPlantByIdService } from './get-plant-by-id.service';

@Injectable()
export class UpdatePlantStatusService {
  constructor(
    private readonly db: DrizzleService,
    private readonly plantPublishValidator: PlantPublishValidator,
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
        await this.plantPublishValidator.assertPublishReady(
          plantId,
          product.thumbnailId,
          tx,
          lang,
        );
      }

      await tx
        .update(productsTable)
        .set({ status: targetStatus })
        .where(eq(productsTable.id, plantId));

      return this.getPlantByIdService.execute(shopId, plantId);
    });
  }
}
