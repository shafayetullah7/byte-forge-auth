import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  ShopVerificationActionEnum,
  ShopVerificationStatusEnum,
} from '@/_db/drizzle/enum';
import {
  NotificationEventNames,
  ShopVerificationDecidedEvent,
} from '@/common/modules/events/events';
import { ShopRepository } from '../../repositories/shop.repository';
import { ShopVerificationHistoryRepository } from '../../repositories/shop-verification-history.repository';
import { ShopVerificationRepository } from '../../repositories/shop-verification.repository';
import { throwIfShopDomainError } from '../utils/shop-domain-error.util';

@Injectable()
export class ApproveShopCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly shopVerificationRepository: ShopVerificationRepository,
    private readonly shopVerificationHistoryRepository: ShopVerificationHistoryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(shopId: string) {
    const ownerId = await this.db.transaction(async (tx) => {
      const currentVerification = await this.shopVerificationRepository.findOne(
        { shopId },
        tx,
      );

      const verifications = await this.shopVerificationRepository.update(
        {
          status: ShopVerificationStatusEnum.APPROVED,
          verifiedAt: new Date(),
          rejectionReason: null,
          adminNotes: null,
        },
        { shopId },
        tx,
      );

      const verification = verifications[0];

      if (!verification) {
        throw new NotFoundException('Verification record not found');
      }

      const shop = await this.shopRepository.getShopEntityById(shopId, {
        tx,
        lock: true,
      });

      if (!shop) {
        throw new NotFoundException('Shop not found');
      }

      try {
        shop.approveVerification();
      } catch (error) {
        throwIfShopDomainError(error);
        throw error;
      }

      await this.shopRepository.updateShopEntity(shop, tx);

      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.APPROVED,
          previousStatus: currentVerification?.status,
          newStatus: ShopVerificationStatusEnum.APPROVED,
        },
        tx,
      );

      return shop.ownerId;
    });

    this.eventEmitter.emit(
      NotificationEventNames.SHOP_VERIFICATION_DECIDED,
      new ShopVerificationDecidedEvent({
        shopId,
        ownerId,
        decision: 'approved',
      }),
    );

    return this.shopVerificationRepository.findOne({ shopId });
  }
}
