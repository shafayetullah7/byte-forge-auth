import { Injectable } from '@nestjs/common';
import type { MyShopStatusResponse } from '../../mappers/shop.mapper.types';
import { ShopRepository } from '../../repositories/shop.repository';

@Injectable()
export class GetShopStatusQuery {
  constructor(private readonly shopRepository: ShopRepository) {}

  async execute(userId: string): Promise<MyShopStatusResponse | null> {
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
}
