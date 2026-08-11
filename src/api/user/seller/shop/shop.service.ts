import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { ShopRepository } from '@/modules/shop/repositories';
import { ShopVerificationRepository } from '@/_repositories/business/shop.verification.repository/shop.verification.repository';
import { TNewShopVerification, TMedia } from '@/_db/drizzle/schema';
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
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { mapToLocalizedShopDetails } from '@/modules/shop/mappers/shop.mapper';
import {
  NotificationEventNames,
  ShopVerificationSubmittedEvent,
} from '@/common/modules/events/events';
import { VerificationStatus } from './shop.types';

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
    return mapToLocalizedShopDetails(updatedShop!, lang);
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
