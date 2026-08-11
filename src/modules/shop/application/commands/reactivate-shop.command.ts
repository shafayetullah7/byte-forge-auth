import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { ShopStatusEnum, ShopVerificationActionEnum } from '@/_db/drizzle/enum';
import { ShopRepository } from '../../repositories/shop.repository';
import { ShopVerificationHistoryRepository } from '../../repositories/shop-verification-history.repository';
import { throwIfShopDomainError } from '../utils/shop-domain-error.util';

@Injectable()
export class ReactivateShopCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly shopVerificationHistoryRepository: ShopVerificationHistoryRepository,
  ) {}

  async execute(shopId: string) {
    const shop = await this.shopRepository.getShopEntityById(shopId);

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const previousStatus = shop.status;

    try {
      shop.reactivate();
    } catch (error) {
      throwIfShopDomainError(error);
      throw error;
    }

    await this.db.transaction(async (tx) => {
      await this.shopRepository.updateShopEntity(shop, tx);

      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.REACTIVATED,
          previousStatus,
          newStatus: ShopStatusEnum.ACTIVE,
        },
        tx,
      );
    });

    return { message: 'Shop reactivated successfully' };
  }
}
