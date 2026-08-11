import { Injectable } from '@nestjs/common';
import { ShopVerificationHistoryRepository } from '../../repositories/shop-verification-history.repository';

@Injectable()
export class GetMyVerificationHistoryQuery {
  constructor(
    private readonly shopVerificationHistoryRepository: ShopVerificationHistoryRepository,
  ) {}

  execute(shopId: string) {
    return this.shopVerificationHistoryRepository.findByShopId(shopId, {
      orderBy: { createdAt: 'desc' },
    });
  }
}
