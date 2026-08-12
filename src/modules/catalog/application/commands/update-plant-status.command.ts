import { Injectable, HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productsTable } from '@/_db/drizzle/schema';
import { ProductStatusEnum, TProductStatus } from '@/_db/drizzle/enum';
import { PlantPublishValidator } from '@/modules/catalog/application/plant-publish.validator';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { GetSellerPlantByIdQuery } from '../queries/get-seller-plant-by-id.query';
import { ShopQueryService } from '@/modules/shop/application/queries';

@Injectable()
export class UpdatePlantStatusCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly plantPublishValidator: PlantPublishValidator,
    private readonly getSellerPlantByIdQuery: GetSellerPlantByIdQuery,
    private readonly shopQueryService: ShopQueryService,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    userId: string,
    plantId: string,
    targetStatus: TProductStatus,
    lang: string,
  ) {
    const shop = await this.resolveShop(userId, lang);
    return this.db.transaction(async (tx) => {
      const product = await tx.query.productsTable.findFirst({
        where: and(
          eq(productsTable.id, plantId),
          eq(productsTable.shopId, shop.id),
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
        return this.getSellerPlantByIdQuery.executeForShop(shop.id, plantId);
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

      return this.getSellerPlantByIdQuery.executeForShop(shop.id, plantId);
    });
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
