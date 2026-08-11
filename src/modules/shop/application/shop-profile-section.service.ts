import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { DrizzleTx } from '@/libs/db/types';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import {
  mapToLocalizedShopDetails,
  type LocalizedShopDetails,
} from '../mappers/shop.mapper';
import { ShopRepository } from '../repositories/shop.repository';

@Injectable()
export class ShopProfileSectionService {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly i18n: I18nService,
  ) {}

  async updateSection(
    shopId: string,
    lang: string,
    updateFn: (tx: DrizzleTx, shop: { ownerId: string }) => Promise<void>,
  ): Promise<LocalizedShopDetails> {
    return this.db.transaction(async (tx) => {
      const shop = await this.shopRepository.getShopById(shopId, {
        tx,
        lock: true,
      });

      if (!shop) {
        throw new CustomException({
          message: this.i18n.t('message.error.shopNotFound', { lang }),
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCode.NOT_FOUND,
        });
      }

      await updateFn(tx, shop);

      const updatedShop = await this.shopRepository.getShopByOwnerBranding(
        shop.ownerId,
      );
      if (!updatedShop) {
        throw new CustomException({
          message: this.i18n.t('message.error.shopNotFound', { lang }),
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCode.NOT_FOUND,
        });
      }
      return mapToLocalizedShopDetails(updatedShop, lang);
    });
  }
}
