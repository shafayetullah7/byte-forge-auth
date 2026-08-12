import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { MediaRepository } from '@/modules/media/repositories/media.repository';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import type { UpdateShopInfoDto } from '../../controllers/dto/update-shop-info.dto';
import {
  mapToLocalizedShopDetails,
  type LocalizedShopDetails,
} from '../../mappers/shop.mapper';
import { ShopRepository } from '../../repositories/shop.repository';

@Injectable()
export class UpsertMyShopInfoCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    shopId: string,
    dto: UpdateShopInfoDto,
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

      const newMediaIds: string[] = [];
      if (dto.branding?.logoId) newMediaIds.push(dto.branding.logoId);
      if (dto.branding?.bannerId) newMediaIds.push(dto.branding.bannerId);

      if (newMediaIds.length > 0) {
        const existenceCheck = await this.mediaRepository.checkMediaExistence(
          newMediaIds,
          tx,
        );
        if (!existenceCheck.valid) {
          throw new CustomException({
            message: this.i18n.t('message.error.mediaNotFound', { lang }),
            statusCode: HttpStatus.BAD_REQUEST,
            errorCode: ErrorCode.VALIDATION_ERROR,
            validationErrors: existenceCheck.invalidIds.map((id) => ({
              field: 'logoId/bannerId',
              message: `Media ID ${id} does not exist`,
              code: 'invalid_media',
            })),
          });
        }

        const isOwner = await this.mediaRepository.verifyMediaOwnership(
          newMediaIds,
          shop.ownerId,
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

      if (dto.slug && dto.slug !== shop.slug) {
        const existingShop = await this.shopRepository.getShopBySlug(dto.slug);
        if (existingShop && existingShop.id !== shop.id) {
          throw new CustomException({
            message: this.i18n.t('message.error.shopNameTaken', { lang }),
            statusCode: HttpStatus.CONFLICT,
            errorCode: ErrorCode.CONFLICT,
          });
        }
      }

      if (dto.branding && dto.branding.logoId !== undefined) {
        const newLogoId = dto.branding.logoId ?? null;
        if (newLogoId !== shop.logoId) {
          if (shop.logoId) {
            await this.mediaRepository.decrementMediaUsage([shop.logoId], tx);
          }
          if (newLogoId) {
            await this.mediaRepository.incrementMediaUsage([newLogoId], tx);
          }
        }
      }

      if (dto.branding && dto.branding.bannerId !== undefined) {
        const newBannerId = dto.branding.bannerId ?? null;
        if (newBannerId !== shop.bannerId) {
          if (shop.bannerId) {
            await this.mediaRepository.decrementMediaUsage([shop.bannerId], tx);
          }
          if (newBannerId) {
            await this.mediaRepository.incrementMediaUsage([newBannerId], tx);
          }
        }
      }

      if (dto.branding || dto.slug) {
        const updatePayload: Record<string, string | null | undefined> = {
          ...(dto.slug && { slug: dto.slug }),
        };

        if (dto.branding) {
          if (dto.branding.logoId !== undefined) {
            updatePayload.logoId = dto.branding.logoId ?? null;
          }
          if (dto.branding.bannerId !== undefined) {
            updatePayload.bannerId = dto.branding.bannerId ?? null;
          }
          if (dto.branding.primaryColor !== undefined) {
            updatePayload.primaryColor = dto.branding.primaryColor;
          }
          if (dto.branding.secondaryColor !== undefined) {
            updatePayload.secondaryColor = dto.branding.secondaryColor;
          }
          if (dto.branding.accentColor !== undefined) {
            updatePayload.accentColor = dto.branding.accentColor;
          }
        }

        await this.shopRepository.update(shopId, updatePayload, tx);
      }

      if (dto.translations) {
        const shopWithTranslations =
          await this.shopRepository.getShopWithTranslations(shopId);
        const enCurrent = shopWithTranslations?.translations?.find(
          (t) => t.locale === 'en',
        );
        const bnCurrent = shopWithTranslations?.translations?.find(
          (t) => t.locale === 'bn',
        );

        await this.shopRepository.upsertShopTranslation(
          {
            shopId,
            locale: 'en',
            name: dto.translations.en.name,
            description: dto.translations.en.description || null,
            businessHours: dto.translations.en.businessHours || null,
            tagline: enCurrent?.tagline ?? null,
            about: enCurrent?.about ?? null,
            sellerStory: enCurrent?.sellerStory ?? null,
            brandMission: enCurrent?.brandMission ?? null,
          },
          tx,
        );

        await this.shopRepository.upsertShopTranslation(
          {
            shopId,
            locale: 'bn',
            name: dto.translations.bn.name,
            description: dto.translations.bn.description || null,
            businessHours: dto.translations.bn.businessHours || null,
            tagline: bnCurrent?.tagline ?? null,
            about: bnCurrent?.about ?? null,
            sellerStory: bnCurrent?.sellerStory ?? null,
            brandMission: bnCurrent?.brandMission ?? null,
          },
          tx,
        );
      }

      const updatedShop = await this.shopRepository.getShopByOwnerWithRelations(
        shop.ownerId,
      );
      return mapToLocalizedShopDetails(updatedShop!, lang);
    });
  }
}
