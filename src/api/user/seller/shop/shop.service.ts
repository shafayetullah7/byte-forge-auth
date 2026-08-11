import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { DrizzleTx } from '@/_db/drizzle/types';
import { ShopRepository } from '@/modules/shop/repositories';
import { ShopVerificationRepository } from '@/_repositories/business/shop.verification.repository/shop.verification.repository';
import { ApplySellerDto } from './dto/apply.seller.dto';
import { TNewShop, TNewShopVerification, TMedia } from '@/_db/drizzle/schema';
import { MediaRepository } from '@/_repositories/providers/media/media.repository/media.repository';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import {
  ShopVerificationStatusEnum,
  ShopVerificationActionEnum,
} from '@/_db/drizzle/enum';
import { ShopVerificationHistoryRepository } from '@/_repositories/business/shop.verification.history.repository/shop.verification.history.repository';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { UpdateShopContactDto } from './dto/update-shop-contact.dto';
import { UpdateShopAddressDto } from './dto/update-shop-address.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { UpdateShopInfoDto } from './dto/update-shop-info.dto';
import { TNewShopTranslation } from '@/_db/drizzle/schema/shop';
import { shopContactTable } from '@/_db/drizzle/schema/shop/shop.contact.schema';
import { shopAddressTable } from '@/_db/drizzle/schema/shop/shop.address.schema';
import { shopAddressTranslationsTable } from '@/_db/drizzle/schema/shop/shop.address.translation.schema';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import {
  NotificationEventNames,
  ShopVerificationSubmittedEvent,
} from '@/common/modules/events/events';
import {
  LocalizedShopDetails,
  ShopStatus,
  TShopWithBranding,
  VerificationStatus,
} from './shop.types';

@Injectable()
export class ShopService {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly shopVerificationRepository: ShopVerificationRepository,
    private readonly shopVerificationHistoryRepository: ShopVerificationHistoryRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly i18n: I18nService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async applyAsSeller(userId: string, payload: ApplySellerDto, lang: string) {
    return this.db.transaction(async (tx) => {
      // 1. Check if user already owns a shop
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

      // 2. Validate shop name uniqueness (English version for slug and global check)
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

      // 3. Media Validation
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

        // Mark media as used (increment count)
        await this.mediaRepository.incrementMediaUsage(mediaIds, tx);
      }

      // 4. Create Shop
      // Use provided slug or generate from English shop name
      const slug = payload.slug || this.generateSlug(englishTranslation.name);

      // Validate slug uniqueness if provided
      if (payload.slug) {
        const existingShop = await this.shopRepository.findShopBySlug(slug, {
          tx,
          lock: false,
        });
        if (existingShop) {
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

      // 5. Create Translations
      const translationPayloads = payload.translations.map((t) => ({
        ...t,
        shopId: shop.id,
      }));
      await this.shopRepository.createShopTranslations(translationPayloads, tx);

      return shop;
    });
  }

  /**
   * Get localized shop details - returns shop info with translations, logo, and banner only
   * Used for public shop display and basic shop information
   */
  async getLocalizedShopDetails(
    userId: string,
    lang: string,
  ): Promise<LocalizedShopDetails | null> {
    const data = await this.shopRepository.getShopByOwnerBranding(userId);

    if (!data) return null;

    return this.mapToLocalizedShopDetails(data, lang);
  }

  /**
   * Get minimal shop status for routing decisions
   * Returns only essential fields to check if user has a shop setup
   */
  async getShopStatus(userId: string): Promise<ShopStatus | null> {
    const data = await this.shopRepository.getShopByOwnerMinimal(userId);

    if (!data) return null;

    return {
      id: data.id,
      slug: data.slug,
      status: data.status,
      hasTranslations: data.translations?.length > 0,
      rejectionReason: data.shopVerificationTable?.rejectionReason ?? null,
    };
  }

  async updateMyShop(shopId: string, dto: UpdateShopDto, lang: string) {
    return this.db.transaction(async (tx) => {
      // 1. Fetch and Lock
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

      // 2. Upsert translations
      if (dto.translations && dto.translations.length > 0) {
        for (const translation of dto.translations) {
          const payload = {
            ...translation,
            shopId: shop.id,
          } as any as TNewShopTranslation;
          await this.shopRepository.upsertShopTranslation(payload, tx);
        }
      }

      const updatedShop = await this.shopRepository.getShopByOwnerBranding(
        shop.ownerId,
      );
      return this.mapToLocalizedShopDetails(updatedShop!, lang);
    });
  }

  async updateMyBranding(shopId: string, dto: UpdateBrandingDto, lang: string) {
    return this.db.transaction(async (tx) => {
      // 1. Fetch and Lock
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

      // 2. Media Ownership Validation
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

        // Mark media as used (increment count)
        await this.mediaRepository.incrementMediaUsage(mediaIds, tx);
      }

      // 2b. Decrement old media if replaced
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

      // 3. Update shop fields
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
      return this.mapToLocalizedShopDetails(updatedShop!, lang);
    });
  }

  private async updateShopSection(
    shopId: string,
    lang: string,
    updateFn: (tx: DrizzleTx, shop: { ownerId: string }) => Promise<void>,
  ) {
    return this.db.transaction(async (tx) => {
      // 1. Fetch and Lock
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

      // 2. Perform the update
      await updateFn(tx, shop);

      const updatedShop = await this.shopRepository.getShopByOwnerBranding(
        shop.ownerId,
      );
      return this.mapToLocalizedShopDetails(updatedShop!, lang);
    });
  }

  async upsertMyShopContact(
    shopId: string,
    dto: UpdateShopContactDto,
    lang: string,
  ) {
    return this.updateShopSection(shopId, lang, async (tx) => {
      await this.shopRepository.upsertShopContact(
        shopId,
        {
          // Contact Information
          ...(dto.businessEmail !== undefined && {
            businessEmail: dto.businessEmail,
          }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.alternativePhone !== undefined && {
            alternativePhone: dto.alternativePhone,
          }),
          ...(dto.whatsapp !== undefined && { whatsapp: dto.whatsapp }),
          ...(dto.telegram !== undefined && { telegram: dto.telegram }),

          // Social Media
          ...(dto.facebook !== undefined && { facebook: dto.facebook }),
          ...(dto.instagram !== undefined && { instagram: dto.instagram }),
          ...(dto.x !== undefined && { x: dto.x }),
        },
        tx,
      );
    });
  }

  async updateMyShopAddress(
    shopId: string,
    dto: UpdateShopAddressDto,
    lang: string,
  ) {
    return this.updateShopSection(shopId, lang, async (tx) => {
      // 1. Upsert main address (non-translatable fields)
      const addressPayload: Partial<typeof shopAddressTable.$inferInsert> = {};

      if (dto.postalCode !== undefined) {
        addressPayload.postalCode = dto.postalCode;
      }

      if (dto.latitude !== undefined && dto.latitude !== '') {
        // Convert string to decimal with 10 decimal places precision
        const lat = parseFloat(dto.latitude);
        if (!isNaN(lat)) {
          addressPayload.latitude = lat.toFixed(10);
        }
      }

      if (dto.longitude !== undefined && dto.longitude !== '') {
        const lng = parseFloat(dto.longitude);
        if (!isNaN(lng)) {
          addressPayload.longitude = lng.toFixed(10);
        }
      }

      if (dto.googleMapsLink !== undefined) {
        addressPayload.googleMapsLink = dto.googleMapsLink;
      }

      // If only translations are provided (no non-translatable fields),
      // we still need to upsert the address record with minimal data
      const address = await this.shopRepository.upsertShopAddress(
        shopId,
        Object.keys(addressPayload).length > 0
          ? addressPayload
          : { postalCode: '' },
        tx,
      );

      // 2. Upsert translations (both languages)
      if (dto.translations) {
        // Upsert English translation
        await this.shopRepository.upsertShopAddressTranslation(
          address.id,
          {
            locale: 'en',
            country: dto.translations.en.country,
            division: dto.translations.en.division,
            district: dto.translations.en.district,
            street: dto.translations.en.street,
          },
          tx,
        );

        // Upsert Bengali translation
        await this.shopRepository.upsertShopAddressTranslation(
          address.id,
          {
            locale: 'bn',
            country: dto.translations.bn.country,
            division: dto.translations.bn.division,
            district: dto.translations.bn.district,
            street: dto.translations.bn.street,
          },
          tx,
        );
      }
    });
  }

  /**
   * Update shop info (branding + translations) with media counting
   * Handles logo/banner upload count increment/decrement
   */
  async upsertMyShopInfo(shopId: string, dto: UpdateShopInfoDto, lang: string) {
    return this.db.transaction(async (tx) => {
      // 1. Fetch and lock shop data
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

      // 2. Collect all media IDs to validate (new logo + new banner)
      const newMediaIds: string[] = [];
      if (dto.branding?.logoId) newMediaIds.push(dto.branding.logoId);
      if (dto.branding?.bannerId) newMediaIds.push(dto.branding.bannerId);

      // 3. Validate media existence and ownership (if new media provided)
      if (newMediaIds.length > 0) {
        // Check media exists
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

        // Check media ownership
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

      // 4. Check slug uniqueness (if changed)
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

      // 5. Handle media counting for logo (only if logoId is explicitly provided)
      if (dto.branding && dto.branding.logoId !== undefined) {
        const newLogoId = dto.branding.logoId ?? null;

        if (newLogoId !== shop.logoId) {
          // Decrement old logo count
          if (shop.logoId) {
            await this.mediaRepository.decrementMediaUsage([shop.logoId], tx);
          }
          // Increment new logo count (if provided)
          if (newLogoId) {
            await this.mediaRepository.incrementMediaUsage([newLogoId], tx);
          }
        }
      }

      // 6. Handle media counting for banner (only if bannerId is explicitly provided)
      if (dto.branding && dto.branding.bannerId !== undefined) {
        const newBannerId = dto.branding.bannerId ?? null;

        if (newBannerId !== shop.bannerId) {
          // Decrement old banner count
          if (shop.bannerId) {
            await this.mediaRepository.decrementMediaUsage([shop.bannerId], tx);
          }
          // Increment new banner count (if provided)
          if (newBannerId) {
            await this.mediaRepository.incrementMediaUsage([newBannerId], tx);
          }
        }
      }

      // 7. Update shop table (branding + slug) - only update fields that are provided
      if (dto.branding || dto.slug) {
        const updatePayload: Record<string, string | null | undefined> = {
          ...(dto.slug && { slug: dto.slug }),
        };

        // Only update branding fields that are explicitly provided
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

      // 8. Upsert translations (both languages)
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

      // 9. Return updated shop with full data
      const updatedShop = await this.shopRepository.getShopByOwnerWithRelations(
        shop.ownerId,
      );
      return this.mapToLocalizedShopDetails(updatedShop!, lang);
    });
  }

  /**
   * Maps shop branding data to include localized content based on requested language
   * Returns simplified shop details with only translations, logo, and banner
   */
  private mapToLocalizedShopDetails(
    shop: TShopWithBranding & {
      shopContactTable?: typeof shopContactTable.$inferSelect | null;
      shopAddressTable?:
        | (typeof shopAddressTable.$inferSelect & {
            translations: (typeof shopAddressTranslationsTable.$inferSelect)[];
          })
        | null;
    },
    lang: string,
  ): LocalizedShopDetails {
    const translation = resolveTranslation(shop.translations, lang) as {
      name: string;
      description: string | null;
      businessHours: string | null;
    } | null;

    return {
      id: shop.id,
      ownerId: shop.ownerId,
      slug: shop.slug,
      logoId: shop.logoId,
      bannerId: shop.bannerId,
      status: shop.status,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
      name: translation?.name ?? '',
      description: translation?.description ?? null,
      businessHours: translation?.businessHours ?? null,
      logo: shop.logo
        ? {
            id: shop.logo.id,
            url: shop.logo.url,
            mimeType: shop.logo.mimeType,
            fileName: shop.logo.fileName,
            size: shop.logo.size,
          }
        : null,
      banner: shop.banner
        ? {
            id: shop.banner.id,
            url: shop.banner.url,
            mimeType: shop.banner.mimeType,
            fileName: shop.banner.fileName,
            size: shop.banner.size,
          }
        : null,
      translations: shop.translations,
      contact: shop.shopContactTable
        ? {
            businessEmail: shop.shopContactTable.businessEmail,
            phone: shop.shopContactTable.phone,
            alternativePhone: shop.shopContactTable.alternativePhone,
            whatsapp: shop.shopContactTable.whatsapp,
            telegram: shop.shopContactTable.telegram,
            facebook: shop.shopContactTable.facebook,
            instagram: shop.shopContactTable.instagram,
            x: shop.shopContactTable.x,
          }
        : null,
      address: shop.shopAddressTable
        ? {
            postalCode: shop.shopAddressTable.postalCode,
            latitude: shop.shopAddressTable.latitude,
            longitude: shop.shopAddressTable.longitude,
            googleMapsLink: shop.shopAddressTable.googleMapsLink,
            isVerified: shop.shopAddressTable.isVerified,
            translations:
              shop.shopAddressTable.translations?.map((t) => ({
                locale: t.locale,
                country: t.country,
                division: t.division,
                district: t.district,
                street: t.street,
              })) || [],
          }
        : null,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get verification status for a user's shop
   */
  async getVerificationStatus(
    userId: string,
  ): Promise<VerificationStatus | null> {
    const shop = await this.shopRepository.getShopByOwnerId(userId);

    if (!shop) {
      return null;
    }

    const verification = await this.shopVerificationRepository.findOne({
      shopId: shop.id,
    });

    if (!verification) {
      return null;
    }

    // Fetch media details for all documents in one query
    const mediaIds = [
      verification.tradeLicenseDocumentId,
      verification.tinDocumentId,
      verification.utilityBillDocumentId,
    ].filter(Boolean) as string[];

    const mediaMap = new Map<string, TMedia>();
    if (mediaIds.length > 0) {
      const medias = await this.mediaRepository.findMediaDetailsByIds(mediaIds);
      medias.forEach((media) => mediaMap.set(media.media.id, media.media));
    }

    return {
      id: verification.id,
      shopId: verification.shopId,
      status: verification.status,
      tradeLicenseNumber: verification.tradeLicenseNumber,
      tinNumber: verification.tinNumber,
      tradeLicenseDocumentId: verification.tradeLicenseDocumentId,
      tinDocumentId: verification.tinDocumentId,
      utilityBillDocumentId: verification.utilityBillDocumentId,
      tradeLicenseDocument: verification.tradeLicenseDocumentId
        ? (mediaMap.get(verification.tradeLicenseDocumentId) ?? null)
        : null,
      tinDocument: verification.tinDocumentId
        ? (mediaMap.get(verification.tinDocumentId) ?? null)
        : null,
      utilityBillDocument: verification.utilityBillDocumentId
        ? (mediaMap.get(verification.utilityBillDocumentId) ?? null)
        : null,
      rejectionReason: verification.rejectionReason,
      verifiedAt: verification.verifiedAt,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,
    };
  }

  /**
   * Update verification documents for a shop
   */
  async updateVerificationDocuments(
    shopId: string,
    dto: UpdateVerificationDto,
    lang: string,
  ) {
    return this.db.transaction(async (tx) => {
      // 1. Fetch and Lock
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

      // 2. Validate media ownership if documents are provided
      const mediaIds: string[] = [];
      if (dto.tradeLicenseDocumentId) mediaIds.push(dto.tradeLicenseDocumentId);
      if (dto.tinDocumentId) mediaIds.push(dto.tinDocumentId);
      if (dto.utilityBillDocumentId) mediaIds.push(dto.utilityBillDocumentId);

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

        // Mark media as used (increment count)
        await this.mediaRepository.incrementMediaUsage(mediaIds, tx);
      }

      // 3. Get or create verification record (create if doesn't exist)
      let verification = await this.shopVerificationRepository.findOne({
        shopId,
      });

      if (!verification) {
        // Create verification record on first submission
        verification = await this.shopVerificationRepository.create(
          {
            shopId,
            status: ShopVerificationStatusEnum.PENDING,
          },
          tx,
        );
      } else {
        // EDGE CASE: Prevent resubmission if already PENDING (spam prevention)
        if (
          verification.status === ShopVerificationStatusEnum.PENDING ||
          verification.status === ShopVerificationStatusEnum.REVIEWING
        ) {
          // Decrement media usage since we're not proceeding
          if (mediaIds.length > 0) {
            await this.mediaRepository.decrementMediaUsage(mediaIds, tx);
          }
          throw new CustomException({
            message: this.i18n.t('message.error.verificationAlreadyPending', {
              lang,
            }),
            statusCode: HttpStatus.BAD_REQUEST,
            errorCode: ErrorCode.BAD_REQUEST,
          });
        }

        // EDGE CASE: Prevent resubmission if APPROVED (should use different flow)
        if (verification.status === ShopVerificationStatusEnum.APPROVED) {
          // Decrement media usage since we're not proceeding
          if (mediaIds.length > 0) {
            await this.mediaRepository.decrementMediaUsage(mediaIds, tx);
          }
          throw new CustomException({
            message: this.i18n.t('message.error.shopAlreadyVerified', { lang }),
            statusCode: HttpStatus.BAD_REQUEST,
            errorCode: ErrorCode.BAD_REQUEST,
          });
        }

        // EDGE CASE: Prevent identical resubmissions (no changes made)
        const hasDocumentChanges =
          (dto.tradeLicenseDocumentId &&
            dto.tradeLicenseDocumentId !==
              verification.tradeLicenseDocumentId) ||
          (dto.tinDocumentId &&
            dto.tinDocumentId !== verification.tinDocumentId) ||
          (dto.utilityBillDocumentId &&
            dto.utilityBillDocumentId !== verification.utilityBillDocumentId);

        const hasNumberChanges =
          (dto.tradeLicenseNumber !== undefined &&
            dto.tradeLicenseNumber !== verification.tradeLicenseNumber) ||
          (dto.tinNumber !== undefined &&
            dto.tinNumber !== verification.tinNumber);

        if (!hasDocumentChanges && !hasNumberChanges) {
          // Decrement media usage since we're not proceeding
          if (mediaIds.length > 0) {
            await this.mediaRepository.decrementMediaUsage(mediaIds, tx);
          }
          throw new CustomException({
            message: this.i18n.t('message.error.noChangesInResubmission', {
              lang,
            }),
            statusCode: HttpStatus.BAD_REQUEST,
            errorCode: ErrorCode.BAD_REQUEST,
          });
        }

        // 3.5 Decrement old media if replaced
        const oldMediaIdsToDecrement: string[] = [];
        if (
          dto.tradeLicenseDocumentId &&
          verification.tradeLicenseDocumentId &&
          dto.tradeLicenseDocumentId !== verification.tradeLicenseDocumentId
        ) {
          oldMediaIdsToDecrement.push(verification.tradeLicenseDocumentId);
        }
        if (
          dto.tinDocumentId &&
          verification.tinDocumentId &&
          dto.tinDocumentId !== verification.tinDocumentId
        ) {
          oldMediaIdsToDecrement.push(verification.tinDocumentId);
        }
        if (
          dto.utilityBillDocumentId &&
          verification.utilityBillDocumentId &&
          dto.utilityBillDocumentId !== verification.utilityBillDocumentId
        ) {
          oldMediaIdsToDecrement.push(verification.utilityBillDocumentId);
        }
        if (oldMediaIdsToDecrement.length > 0) {
          await this.mediaRepository.decrementMediaUsage(
            oldMediaIdsToDecrement,
            tx,
          );
        }
      }

      // 4. Update verification record
      const updatePayload: Partial<TNewShopVerification> = {};

      if (dto.tradeLicenseNumber !== undefined) {
        updatePayload.tradeLicenseNumber = dto.tradeLicenseNumber;
      }
      if (dto.tradeLicenseDocumentId !== undefined) {
        updatePayload.tradeLicenseDocumentId = dto.tradeLicenseDocumentId;
      }
      if (dto.tinNumber !== undefined) {
        updatePayload.tinNumber = dto.tinNumber;
      }
      if (dto.tinDocumentId !== undefined) {
        updatePayload.tinDocumentId = dto.tinDocumentId;
      }
      if (dto.utilityBillDocumentId !== undefined) {
        updatePayload.utilityBillDocumentId = dto.utilityBillDocumentId;
      }

      // Reset status to PENDING if any document is updated
      if (
        dto.tradeLicenseDocumentId ||
        dto.tinDocumentId ||
        dto.utilityBillDocumentId
      ) {
        updatePayload.status = ShopVerificationStatusEnum.PENDING;
        updatePayload.rejectionReason = null;

        // CRITICAL: Also update shop status to PENDING_VERIFICATION
        // This ensures consistency between shop status and verification status
        await this.shopRepository.update(
          shopId,
          { status: 'PENDING_VERIFICATION' },
          tx,
        );
      }

      await this.shopVerificationRepository.update(
        updatePayload,
        { shopId },
        tx,
      );

      // 5. Return updated verification status
      return this.getVerificationStatus(shop.ownerId);
    });
  }

  async submitForReview(shopId: string, dto: UpdateShopDto, lang: string) {
    const ownerId = await this.db.transaction(async (tx) => {
      // 1. Fetch and Lock
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

      // 2. Update shop status in shop table
      await this.shopRepository.update(
        shopId,
        { status: 'PENDING_VERIFICATION' },
        tx,
      );

      // 3. Optional updates from dto
      // (Simplified: full implementation could include translation updates if dto carries them)

      // 4. Log verification history
      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.SUBMITTED,
          previousStatus: shop.status,
          newStatus: 'PENDING_VERIFICATION',
          reason: 'Shop submitted for review by seller',
        },
        tx,
      );

      return shop.ownerId;
    });

    this.eventEmitter.emit(
      NotificationEventNames.SHOP_VERIFICATION_SUBMITTED,
      new ShopVerificationSubmittedEvent({ shopId, ownerId }),
    );

    const updatedShop =
      await this.shopRepository.getShopByOwnerBranding(ownerId);
    return this.mapToLocalizedShopDetails(updatedShop!, lang);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async uploadImages(
    shopId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    files: { logo?: Express.Multer.File; banner?: Express.Multer.File }, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    const result: { logoId?: string; bannerId?: string } = {};
    // Placeholder for image upload logic
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async deleteShop(shopId: string, lang: string) {
    // Placeholder - full implementation needs orders module
    console.log('Delete shop:', shopId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getVerificationHistory(shopId: string, lang: string) {
    return this.shopVerificationHistoryRepository.findByShopId(shopId, {
      orderBy: { createdAt: 'desc' },
    });
  }
}
