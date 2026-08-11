import { Injectable } from '@nestjs/common';
import { ShopStorefrontRepository } from '../../repositories/shop-storefront.repository';

@Injectable()
export class GetShopCategoriesServedQuery {
  constructor(
    private readonly shopStorefrontRepository: ShopStorefrontRepository,
  ) {}

  execute(shopId: string, lang: string): Promise<string[]> {
    return this.shopStorefrontRepository.getCategoriesServed(shopId, lang);
  }
}
