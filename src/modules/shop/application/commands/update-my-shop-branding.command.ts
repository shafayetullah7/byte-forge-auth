import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { MediaRepository } from '@/_repositories/providers/media/media.repository/media.repository';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import type { UpdateBrandingDto } from '../../controllers/dto/update-branding.dto';
import {
  mapToLocalizedShopDetails,
  type LocalizedShopDetails,
} from '../../mappers/shop.mapper';
import { ShopRepository } from '../../repositories/shop.repository';

@Injectable()
export class UpdateMyShopBrandingCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    shopId: string,
    dto: UpdateBrandingDto,
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

      const mediaIds: string[] = [];
      if (dto.logoId) mediaIds.push(dto.logoId);
      if (dto.bannerId) mediaIds.push(dto.bannerId);

      if (mediaIds.length > 0) {
        const medias = await this.mediaRepository.findMediaDetailsByIds(
          mediaIds,
          { tx, lock: true },
        );

        if (medias.find((m) => m.userUploadMedia.userId !== shop.ownerId)) {
          throw new CustomException({
            message: this.i18n.t('message.error.mediaNotOwned', { lang }),
            statusCode: HttpStatus.FORBIDDEN,
            errorCode: ErrorCode.FORBIDDEN,
          });
        }

        if (!this.mediaRepository.verifyMediaExistence(mediaIds, medias)) {
          throw new CustomException({
            message: this.i18n.t('message.error.mediaNotFound', { lang }),
            statusCode: HttpStatus.NOT_FOUND,
            errorCode: ErrorCode.NOT_FOUND,
          });
        }

        await this.mediaRepository.incrementMediaUsage(mediaIds, tx);
      }

      const oldMediaIdsToDecrement: string[] = [];
      if (dto.logoId && shop.logoId && dto.logoId !== shop.logoId) {
        oldMediaIdsToDecrement.push(shop.logoId);
      }
      if (dto.bannerId && shop.bannerId && dto.bannerId !== shop.bannerId) {
        oldMediaIdsToDecrement.push(shop.bannerId);
      }
      if (oldMediaIdsToDecrement.length > 0) {
        await this.mediaRepository.decrementMediaUsage(
          oldMediaIdsToDecrement,
          tx,
        );
      }

      await this.shopRepository.update(
        shop.id,
        {
          logoId: dto.logoId,
          bannerId: dto.bannerId,
          primaryColor: dto.primaryColor,
          secondaryColor: dto.secondaryColor,
          accentColor: dto.accentColor,
        },
        tx,
      );

      const updatedShop = await this.shopRepository.getShopByOwnerBranding(
        shop.ownerId,
      );
      return mapToLocalizedShopDetails(updatedShop!, lang);
    });
  }
}
