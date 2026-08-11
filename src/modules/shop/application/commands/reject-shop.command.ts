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
import type { AdminRejectShopDto } from '../../controllers/dto/admin-reject-shop.dto';
import { ShopRepository } from '../../repositories/shop.repository';
import { ShopVerificationHistoryRepository } from '../../repositories/shop-verification-history.repository';
import { ShopVerificationRepository } from '../../repositories/shop-verification.repository';
import { throwIfShopDomainError } from '../utils/shop-domain-error.util';

@Injectable()
export class RejectShopCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly shopVerificationRepository: ShopVerificationRepository,
    private readonly shopVerificationHistoryRepository: ShopVerificationHistoryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(shopId: string, dto: AdminRejectShopDto) {
    const { ownerId, reason } = await this.db.transaction(async (tx) => {
      const currentVerification = await this.shopVerificationRepository.findOne(
        { shopId },
        tx,
      );

      const verifications = await this.shopVerificationRepository.update(
        {
          status: ShopVerificationStatusEnum.REJECTED,
          verifiedAt: null,
          rejectionReason: dto.reason,
          adminNotes: dto.adminNotes || null,
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
        shop.rejectVerification();
      } catch (error) {
        throwIfShopDomainError(error);
        throw error;
      }

      await this.shopRepository.updateShopEntity(shop, tx);

      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.REJECTED,
          previousStatus: currentVerification?.status,
          newStatus: ShopVerificationStatusEnum.REJECTED,
          reason: dto.reason,
          changes: dto.adminNotes ? { adminNotes: dto.adminNotes } : undefined,
        },
        tx,
      );

      return { ownerId: shop.ownerId, reason: dto.reason };
    });

    this.eventEmitter.emit(
      NotificationEventNames.SHOP_VERIFICATION_DECIDED,
      new ShopVerificationDecidedEvent({
        shopId,
        ownerId,
        decision: 'rejected',
        reason,
      }),
    );

    return this.shopVerificationRepository.findOne({ shopId });
  }
}
