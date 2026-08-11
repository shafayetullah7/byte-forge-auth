import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  ShopStatusEnum,
  ShopVerificationActionEnum,
  ShopVerificationStatusEnum,
} from '@/_db/drizzle/enum';
import type { AdminSuspendShopDto } from '../../controllers/dto/admin-suspend-shop.dto';
import { ShopRepository } from '../../repositories/shop.repository';
import { ShopVerificationHistoryRepository } from '../../repositories/shop-verification-history.repository';
import { ShopVerificationRepository } from '../../repositories/shop-verification.repository';
import { throwIfShopDomainError } from '../utils/shop-domain-error.util';

@Injectable()
export class SuspendShopCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly shopVerificationRepository: ShopVerificationRepository,
    private readonly shopVerificationHistoryRepository: ShopVerificationHistoryRepository,
  ) {}

  async execute(shopId: string, dto: AdminSuspendShopDto) {
    const shop = await this.shopRepository.getShopEntityById(shopId);

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const previousStatus = shop.status;

    try {
      shop.suspend();
    } catch (error) {
      throwIfShopDomainError(error);
      throw error;
    }

    await this.db.transaction(async (tx) => {
      await this.shopRepository.updateShopEntity(shop, tx);

      await this.shopVerificationRepository.update(
        { status: ShopVerificationStatusEnum.REJECTED },
        { shopId },
        tx,
      );

      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.SUSPENDED,
          previousStatus,
          newStatus: ShopStatusEnum.SUSPENDED,
          reason: dto.reason,
        },
        tx,
      );
    });

    return { message: 'Shop suspended successfully' };
  }
}
