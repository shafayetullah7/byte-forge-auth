import { Injectable } from '@nestjs/common';
import { ShopRepository } from '@/modules/shop/repositories';
import { ShopStorefrontRepository } from '@/_repositories/business/shop-storefront.repository/shop-storefront.repository';

function mapListItemForSeller(item: {
  id: string;
  displayOrder: number;
  translations: Array<{ locale: string; text: string }>;
}) {
  const en = item.translations.find((t) => t.locale === 'en');
  const bn = item.translations.find((t) => t.locale === 'bn');
  return {
    id: item.id,
    displayOrder: item.displayOrder,
    translations: {
      en: { text: en?.text ?? '' },
      bn: { text: bn?.text ?? '' },
    },
  };
}

function mapProfileTranslations(
  translations:
    | Array<{
        locale: string;
        tagline: string | null;
        about: string | null;
        sellerStory: string | null;
        brandMission: string | null;
      }>
    | undefined,
) {
  const en = translations?.find((t) => t.locale === 'en');
  const bn = translations?.find((t) => t.locale === 'bn');
  return {
    en: {
      tagline: en?.tagline ?? '',
      about: en?.about ?? '',
      sellerStory: en?.sellerStory ?? '',
      brandMission: en?.brandMission ?? '',
    },
    bn: {
      tagline: bn?.tagline ?? '',
      about: bn?.about ?? '',
      sellerStory: bn?.sellerStory ?? '',
      brandMission: bn?.brandMission ?? '',
    },
  };
}

@Injectable()
export class GetStorefrontService {
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
        translations: mapProfileTranslations(shop?.translations),
      },
      whyChooseUs: whyChooseUs.map(mapListItemForSeller),
      valuePoints: valuePoints.map(mapListItemForSeller),
      categoriesServed: {
        en: categoriesServedEn,
        bn: categoriesServedBn,
        preview: categoriesPreview,
      },
    };
  }
}
