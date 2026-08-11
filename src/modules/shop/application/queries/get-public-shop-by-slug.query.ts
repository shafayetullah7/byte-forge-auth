import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopStatusEnum } from '@/_db/drizzle/enum';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { mapStorefrontListToStrings } from '@/common/utils/map-storefront-list.util';
import { ShopFollowRepository } from '../../repositories/shop-follow.repository';
import { ShopRepository } from '../../repositories/shop.repository';
import { ShopStorefrontRepository } from '../../repositories/shop-storefront.repository';
import { GetShopCategoriesServedQuery } from './get-shop-categories-served.query';
import { ListPublicShopsQuery } from './list-public-shops.query';

@Injectable()
export class GetPublicShopBySlugQuery {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly shopStorefrontRepository: ShopStorefrontRepository,
    private readonly getShopCategoriesServedQuery: GetShopCategoriesServedQuery,
    private readonly listPublicShopsQuery: ListPublicShopsQuery,
    private readonly shopFollowRepository: ShopFollowRepository,
  ) {}

  async execute(slug: string, lang: string, viewerUserId?: string) {
    const shop = await this.shopRepository.getShopBySlug(slug);

    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }

    const translation = resolveTranslation(shop.translations, lang);
    const addressTranslation = shop.shopAddressTable
      ? resolveTranslation(shop.shopAddressTable.translations ?? [], lang)
      : null;

    const metrics = await this.listPublicShopsQuery.getShopMetrics(shop.id);
    const followerCount = await this.shopFollowRepository.countByShopId(
      shop.id,
    );
    const isFollowedByViewer = viewerUserId
      ? Boolean(
          await this.shopFollowRepository.isFollowing(shop.id, viewerUserId),
        )
      : false;

    const [whyChooseUsItems, valuePointItems, categoriesServed] =
      await Promise.all([
        this.shopStorefrontRepository.listWhyChooseUs(shop.id),
        this.shopStorefrontRepository.listValuePoints(shop.id),
        this.getShopCategoriesServedQuery.execute(shop.id, lang),
      ]);

    return {
      id: shop.id,
      slug: shop.slug,
      name: translation?.name ?? '',
      tagline: translation?.tagline ?? null,
      description: translation?.description ?? '',
      businessHours: translation?.businessHours ?? '',
      about: translation?.about ?? translation?.description ?? '',
      sellerStory: translation?.sellerStory ?? null,
      brandMission: translation?.brandMission ?? null,
      whyChooseUs: mapStorefrontListToStrings(whyChooseUsItems, lang),
      values: mapStorefrontListToStrings(valuePointItems, lang),
      categoriesServed,
      division: addressTranslation?.division ?? null,
      city: addressTranslation?.district ?? null,
      isVerified: shop.isVerified,
      status: shop.status,
      primaryColor: shop.primaryColor,
      secondaryColor: shop.secondaryColor,
      accentColor: shop.accentColor,
      logo: shop.logo
        ? {
            id: shop.logo.id,
            url: shop.logo.url,
          }
        : null,
      banner: shop.banner
        ? {
            id: shop.banner.id,
            url: shop.banner.url,
          }
        : null,
      address: shop.shopAddressTable ?? null,
      createdAt: shop.createdAt.toISOString(),
      metrics: { ...metrics, followerCount },
      followerCount,
      isFollowedByViewer,
    };
  }
}
