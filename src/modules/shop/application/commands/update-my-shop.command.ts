import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { TNewShopTranslation } from '@/_db/drizzle/schema/shop';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import type { UpdateShopDto } from '../../controllers/dto/update-shop.dto';
import {
  mapToLocalizedShopDetails,
  type LocalizedShopDetails,
} from '../../mappers/shop.mapper';
import { ShopRepository } from '../../repositories/shop.repository';

@Injectable()
export class UpdateMyShopCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    shopId: string,
    dto: UpdateShopDto,
    lang: string,
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

      if (dto.translations && dto.translations.length > 0) {
        for (const translation of dto.translations) {
          const payload: TNewShopTranslation = {
            ...translation,
            shopId: shop.id,
            name: translation.name ?? '',
          };
          await this.shopRepository.upsertShopTranslation(payload, tx);
        }
      }

      const updatedShop = await this.shopRepository.getShopByOwnerBranding(
        shop.ownerId,
      );
      return mapToLocalizedShopDetails(updatedShop!, lang);
    });
  }
}
