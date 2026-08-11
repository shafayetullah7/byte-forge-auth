import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopRepository } from '@/modules/shop/repositories';
import { ShopStorefrontRepository } from '@/modules/shop/repositories';
import { ShopStatusEnum } from '@/_db/drizzle/enum';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { mapStorefrontListToStrings } from '@/common/utils/map-storefront-list.util';
import { GetShopCategoriesServedService } from './get-shop-categories-served.service';
import { ListPublicShopsService } from './list-public-shops.service';
import { ListPublicShopProductsService } from './list-public-shop-products.service';
import { PublicShopReviewsService } from './public-shop-reviews.service';
import { ListPublicShopCampaignsService } from './list-public-shop-campaigns.service';
import { ListPublicShopArticlesService } from './list-public-shop-articles.service';
import { ShopFollowRepository } from '@/_repositories/business/shop-follow.repository/shop-follow.repository';
import { ListPublicShopsQueryDto } from '../dto/list-public-shops-query.dto';
import { ListPublicShopProductsQueryDto } from '../dto/list-public-shop-products-query.dto';
import { ListPublicShopReviewsQueryDto } from '../dto/list-public-shop-reviews-query.dto';

@Injectable()
export class PublicShopService {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly shopStorefrontRepository: ShopStorefrontRepository,
    private readonly getShopCategoriesServedService: GetShopCategoriesServedService,
    private readonly listPublicShopsService: ListPublicShopsService,
    private readonly listPublicShopProductsService: ListPublicShopProductsService,
    private readonly publicShopReviewsService: PublicShopReviewsService,
    private readonly listPublicShopCampaignsService: ListPublicShopCampaignsService,
    private readonly listPublicShopArticlesService: ListPublicShopArticlesService,
    private readonly shopFollowRepository: ShopFollowRepository,
  ) {}

  listShops(query: ListPublicShopsQueryDto, lang: string) {
    return this.listPublicShopsService.execute(query, lang);
  }

  listShopProducts(
    slug: string,
    query: ListPublicShopProductsQueryDto,
    lang: string,
  ) {
    return this.listPublicShopProductsService.execute(slug, query, lang);
  }

  getShopReviews(
    slug: string,
    query: ListPublicShopReviewsQueryDto,
    lang: string,
  ) {
    return this.publicShopReviewsService.getShopReviews(slug, query, lang);
  }

  listShopCampaigns(slug: string, lang: string) {
    return this.listPublicShopCampaignsService.execute(slug, lang);
  }

  getShopCampaignHighlights(slug: string) {
    return this.listPublicShopCampaignsService.getHighlights(slug);
  }

  getShopCampaignDetail(slug: string, campaignSlug: string, lang: string) {
    return this.listPublicShopCampaignsService.getDetail(
      slug,
      campaignSlug,
      lang,
    );
  }

  listShopArticles(slug: string, lang: string) {
    return this.listPublicShopArticlesService.list(slug, lang);
  }

  getShopArticleDetail(slug: string, articleSlug: string, lang: string) {
    return this.listPublicShopArticlesService.getDetail(
      slug,
      articleSlug,
      lang,
    );
  }

  async getPublicShopBySlug(slug: string, lang: string, viewerUserId?: string) {
    const shop = await this.shopRepository.getShopBySlug(slug);

    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }

    const translation = resolveTranslation(shop.translations, lang);
    const addressTranslation = shop.shopAddressTable
      ? resolveTranslation(shop.shopAddressTable.translations ?? [], lang)
      : null;

    const metrics = await this.listPublicShopsService.getShopMetrics(shop.id);
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
        this.getShopCategoriesServedService.execute(shop.id, lang),
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
