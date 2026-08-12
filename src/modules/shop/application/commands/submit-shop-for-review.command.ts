import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from 'nestjs-i18n';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { ShopVerificationActionEnum } from '@/_db/drizzle/enum';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import {
  NotificationEventNames,
  ShopVerificationSubmittedEvent,
} from '@/libs/modules/events/events';
import type { UpdateShopDto } from '../../controllers/dto/update-shop.dto';
import {
  mapToLocalizedShopDetails,
  type LocalizedShopDetails,
} from '../../mappers/shop.mapper';
import { mapShopRowToEntity } from '../../repositories/shop.repository.mapper';
import { ShopRepository } from '../../repositories/shop.repository';
import { ShopVerificationHistoryRepository } from '../../repositories/shop-verification-history.repository';
import { throwIfShopDomainError } from '../utils/shop-domain-error.util';

@Injectable()
export class SubmitShopForReviewCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly shopVerificationHistoryRepository: ShopVerificationHistoryRepository,
    private readonly i18n: I18nService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    shopId: string,
    _dto: UpdateShopDto,
    lang: string,
  ): Promise<LocalizedShopDetails> {
    const ownerId = await this.db.transaction(async (tx) => {
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

      const shop = mapShopRowToEntity(shopRow);
      const previousStatus = shop.status;

      try {
        shop.submitForReview();
      } catch (error) {
        throwIfShopDomainError(error);
        throw error;
      }

      await this.shopRepository.updateShopEntity(shop, tx);

      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.SUBMITTED,
          previousStatus,
          newStatus: shop.status,
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
    if (!updatedShop) {
      throw new CustomException({
        message: this.i18n.t('message.error.shopNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }
    return mapToLocalizedShopDetails(updatedShop, lang);
  }
}
