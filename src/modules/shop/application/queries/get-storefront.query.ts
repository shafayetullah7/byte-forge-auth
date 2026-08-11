import { Injectable } from '@nestjs/common';
import {
  mapStorefrontListItemForSeller,
  mapStorefrontProfileTranslations,
} from '../../mappers/storefront.mapper';
import { ShopRepository } from '../../repositories/shop.repository';
import { ShopStorefrontRepository } from '../../repositories/shop-storefront.repository';

@Injectable()
export class GetStorefrontQuery {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly shopStorefrontRepository: ShopStorefrontRepository,
  ) {}

  async execute(shopId: string, lang: string) {
    const shop = await this.shopRepository.getShopWithTranslations(shopId);
    const [whyChooseUs, valuePoints, categoriesServedEn, categoriesServedBn] =
      await Promise.all([
        this.shopStorefrontRepository.listWhyChooseUs(shopId),
        this.shopStorefrontRepository.listValuePoints(shopId),
        this.shopStorefrontRepository.getCategoriesServed(shopId, 'en'),
        this.shopStorefrontRepository.getCategoriesServed(shopId, 'bn'),
      ]);

    const categoriesPreview =
      lang === 'bn' ? categoriesServedBn : categoriesServedEn;

    return {
      profile: {
        translations: mapStorefrontProfileTranslations(shop?.translations),
      },
      whyChooseUs: whyChooseUs.map(mapStorefrontListItemForSeller),
      valuePoints: valuePoints.map(mapStorefrontListItemForSeller),
      categoriesServed: {
        en: categoriesServedEn,
        bn: categoriesServedBn,
        preview: categoriesPreview,
      },
    };
  }
}
