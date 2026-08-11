import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { TNewShop, TShop } from '@/_db/drizzle/schema';
import { MediaRepository } from '@/_repositories/providers/media/media.repository/media.repository';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import type { ApplySellerDto } from '../../controllers/dto/apply-seller.dto';
import { ShopRepository } from '../../repositories/shop.repository';
import { generateShopSlug } from '../utils/generate-shop-slug.util';

@Injectable()
export class ApplyAsSellerCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    userId: string,
    payload: ApplySellerDto,
    lang: string,
  ): Promise<TShop> {
    return this.db.transaction(async (tx) => {
      const existingShop = await this.shopRepository.getShopByOwnerId(userId, {
        tx,
        lock: true,
      });

      if (existingShop) {
        throw new CustomException({
          message: this.i18n.t('message.error.shopAlreadyExists', { lang }),
          statusCode: HttpStatus.CONFLICT,
          errorCode: ErrorCode.DUPLICATE_ENTRY,
        });
      }

      const englishTranslation = payload.translations.find(
        (t) => t.locale === 'en',
      );
      if (!englishTranslation) {
        throw new CustomException({
          message: this.i18n.t('message.error.englishTranslationRequired', {
            lang,
          }),
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.VALIDATION_ERROR,
        });
      }

      const shopWithName =
        await this.shopRepository.findShopByNameInTranslations(
          englishTranslation.name,
          { tx, lock: true },
        );

      if (shopWithName) {
        throw new CustomException({
          message: this.i18n.t('message.error.shopNameTaken', { lang }),
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.VALIDATION_ERROR,
        });
      }

      const mediaIds: string[] = [];
      if (payload.logoId) mediaIds.push(payload.logoId);
      if (payload.bannerId) mediaIds.push(payload.bannerId);

      if (mediaIds.length > 0) {
        const medias = await this.mediaRepository.findMediaDetailsByIds(
          mediaIds,
          { tx, lock: true },
        );

        if (medias.find((m) => m.userUploadMedia.userId !== userId)) {
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

      const slug = payload.slug || generateShopSlug(englishTranslation.name);

      if (payload.slug) {
        const existingSlugShop = await this.shopRepository.findShopBySlug(
          slug,
          { tx, lock: false },
        );
        if (existingSlugShop) {
          throw new CustomException({
            message: this.i18n.t('message.error.shopSlugTaken', { lang }),
            statusCode: HttpStatus.BAD_REQUEST,
            errorCode: ErrorCode.VALIDATION_ERROR,
          });
        }
      }

      const shopPayload: TNewShop = {
        ownerId: userId,
        slug,
        logoId: payload.logoId,
        bannerId: payload.bannerId,
      };

      const shop = await this.shopRepository.createShop(shopPayload, tx);

      const translationPayloads = payload.translations.map((t) => ({
        ...t,
        shopId: shop.id,
      }));
      await this.shopRepository.createShopTranslations(translationPayloads, tx);

      return shop;
    });
  }
}
