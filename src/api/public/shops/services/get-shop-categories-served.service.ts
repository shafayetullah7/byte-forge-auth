import { Injectable } from '@nestjs/common';
import { ShopStorefrontRepository } from '@/modules/shop/repositories';

@Injectable()
export class GetShopCategoriesServedService {
  constructor(
    private readonly shopStorefrontRepository: ShopStorefrontRepository,
  ) {}

  execute(shopId: string, lang: string): Promise<string[]> {
    return this.shopStorefrontRepository.getCategoriesServed(shopId, lang);
  }
}
