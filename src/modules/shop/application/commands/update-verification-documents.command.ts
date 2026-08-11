import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { TNewShopVerification } from '@/_db/drizzle/schema';
import { ShopVerificationStatusEnum } from '@/_db/drizzle/enum';
import { MediaRepository } from '@/_repositories/providers/media/media.repository/media.repository';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import type { UpdateVerificationDto } from '../../controllers/dto/update-verification.dto';
import type { VerificationStatusResponse } from '../../mappers/verification.mapper';
import { mapShopRowToEntity } from '../../repositories/shop.repository.mapper';
import { ShopRepository } from '../../repositories/shop.repository';
import { ShopVerificationRepository } from '../../repositories/shop-verification.repository';
import { throwIfShopDomainError } from '../utils/shop-domain-error.util';
import { GetMyShopVerificationQuery } from '../queries/get-my-shop-verification.query';

@Injectable()
export class UpdateVerificationDocumentsCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly shopVerificationRepository: ShopVerificationRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly getMyShopVerificationQuery: GetMyShopVerificationQuery,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    shopId: string,
    dto: UpdateVerificationDto,
    lang: string,
  ): Promise<VerificationStatusResponse | null> {
    return this.db.transaction(async (tx) => {
      const shopRow = await this.shopRepository.getShopById(shopId, {
        tx,
        lock: true,
      });

      if (!shopRow) {
        throw new CustomException({
          message: this.i18n.t('message.error.shopNotFound', { lang }),
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCode.NOT_FOUND,
        });
      }

      const mediaIds: string[] = [];
      if (dto.tradeLicenseDocumentId) mediaIds.push(dto.tradeLicenseDocumentId);
      if (dto.tinDocumentId) mediaIds.push(dto.tinDocumentId);
      if (dto.utilityBillDocumentId) mediaIds.push(dto.utilityBillDocumentId);

      if (mediaIds.length > 0) {
        const medias = await this.mediaRepository.findMediaDetailsByIds(
          mediaIds,
          { tx, lock: true },
        );

        if (medias.find((m) => m.userUploadMedia.userId !== shopRow.ownerId)) {
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

      let verification = await this.shopVerificationRepository.findOne(
        { shopId },
        tx,
      );
      const hadExistingVerification = Boolean(verification);
      const previousVerificationStatus = verification?.status;

      if (!verification) {
        verification = await this.shopVerificationRepository.create(
          {
            shopId,
            status: ShopVerificationStatusEnum.PENDING,
          },
          tx,
        );
      } else {
        if (
          verification.status === ShopVerificationStatusEnum.PENDING ||
          verification.status === ShopVerificationStatusEnum.REVIEWING
        ) {
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

        if (verification.status === ShopVerificationStatusEnum.APPROVED) {
          if (mediaIds.length > 0) {
            await this.mediaRepository.decrementMediaUsage(mediaIds, tx);
          }
          throw new CustomException({
            message: this.i18n.t('message.error.shopAlreadyVerified', { lang }),
            statusCode: HttpStatus.BAD_REQUEST,
            errorCode: ErrorCode.BAD_REQUEST,
          });
        }

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

      if (
        dto.tradeLicenseDocumentId ||
        dto.tinDocumentId ||
        dto.utilityBillDocumentId
      ) {
        updatePayload.status = ShopVerificationStatusEnum.PENDING;
        updatePayload.rejectionReason = null;

        const shop = mapShopRowToEntity(shopRow);
        try {
          if (hadExistingVerification && previousVerificationStatus) {
            shop.resubmitVerificationDocuments(previousVerificationStatus);
          } else {
            shop.submitForReview();
          }
        } catch (error) {
          throwIfShopDomainError(error);
          throw error;
        }
        await this.shopRepository.updateShopEntity(shop, tx);
      }

      await this.shopVerificationRepository.update(
        updatePayload,
        { shopId },
        tx,
      );

      return this.getMyShopVerificationQuery.execute(shopRow.ownerId);
    });
  }
}
