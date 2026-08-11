import { Injectable } from '@nestjs/common';
import {
  mapToLocalizedShopDetails,
  type LocalizedShopDetails,
} from '../../mappers/shop.mapper';
import { ShopRepository } from '../../repositories/shop.repository';

@Injectable()
export class GetMyShopQuery {
  constructor(private readonly shopRepository: ShopRepository) {}

  async execute(
    userId: string,
    lang: string,
  ): Promise<LocalizedShopDetails | null> {
    const data = await this.shopRepository.getShopByOwnerBranding(userId);
    if (!data) return null;
    return mapToLocalizedShopDetails(data, lang);
  }
}
