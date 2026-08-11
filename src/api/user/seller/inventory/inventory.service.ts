import { Injectable, HttpStatus } from '@nestjs/common';
import { GetProductInventoryService } from './services/get-product-inventory.service';
import { GetStockMovementsService } from './services/get-stock-movements.service';
import { RestockVariantService } from './services/restock-variant.service';
import { AdjustStockService } from './services/adjust-stock.service';
import { MarkDamagedService } from './services/mark-damaged.service';
import { ShopQueryService } from '@/modules/shop/application/queries';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { InventoryMovementTypeEnum } from '@/_db/drizzle/enum';

@Injectable()
export class InventoryService {
  constructor(
    private readonly getProductInventoryService: GetProductInventoryService,
    private readonly getStockMovementsService: GetStockMovementsService,
    private readonly restockVariantService: RestockVariantService,
    private readonly adjustStockService: AdjustStockService,
    private readonly markDamagedService: MarkDamagedService,
    private readonly shopQueryService: ShopQueryService,
    private readonly i18n: I18nService,
  ) {}

  async getInventory(userId: string, productId: string, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    const result = await this.getProductInventoryService.execute(
      shop.id,
      productId,
    );

    if (!result) {
      throw new CustomException({
        message: this.i18n.t('message.error.productNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return result;
  }

  async getMovements(
    userId: string,
    productId: string,
    filters: {
      variantId?: string;
      movementType?: InventoryMovementTypeEnum;
      startDate?: string;
      endDate?: string;
    },
    page: number,
    limit: number,
    lang: string,
  ) {
    const shop = await this.resolveShop(userId, lang);
    const result = await this.getStockMovementsService.execute(
      shop.id,
      productId,
      filters,
      page,
      limit,
    );
    console.log(result);
    return result;
  }

  async restock(
    userId: string,
    productId: string,
    data: {
      variantId: string;
      quantity: number;
      referenceType?: string;
      referenceId?: string;
      reason?: string;
    },
    lang: string,
  ) {
    const shop = await this.resolveShop(userId, lang);
    return this.restockVariantService.execute(
      shop.id,
      productId,
      userId,
      data,
      lang,
    );
  }

  async adjust(
    userId: string,
    productId: string,
    data: {
      variantId: string;
      quantityChange: number;
      referenceType?: string;
      referenceId?: string;
      reason: string;
    },
    lang: string,
  ) {
    const shop = await this.resolveShop(userId, lang);
    return this.adjustStockService.execute(
      shop.id,
      productId,
      userId,
      data,
      lang,
    );
  }

  async damaged(
    userId: string,
    productId: string,
    data: {
      variantId: string;
      quantity: number;
      reason?: string;
    },
    lang: string,
  ) {
    const shop = await this.resolveShop(userId, lang);
    return this.markDamagedService.execute(
      shop.id,
      productId,
      userId,
      data,
      lang,
    );
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
