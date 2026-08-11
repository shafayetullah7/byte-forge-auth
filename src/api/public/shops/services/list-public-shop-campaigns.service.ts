import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopRepository } from '@/modules/shop/repositories';
import { ShopCampaignRepository } from '@/_repositories/business/shop-campaign.repository/shop-campaign.repository';
import { ShopStatusEnum } from '@/_db/drizzle/enum';
import {
  mapPublicShopCampaign,
  mapPublicShopCampaignHighlights,
} from '../mappers/public-shop-campaign.mapper';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { ProductStatusEnum } from '@/_db/drizzle/enum';

@Injectable()
export class ListPublicShopCampaignsService {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly campaignRepository: ShopCampaignRepository,
  ) {}

  async execute(slug: string, lang: string) {
    const shop = await this.requireActiveShop(slug);
    const campaigns = await this.campaignRepository.listApprovedByShopId(
      shop.id,
    );
    return campaigns.map((c) => mapPublicShopCampaign(c, lang));
  }

  async getHighlights(slug: string) {
    const shop = await this.requireActiveShop(slug);
    const campaigns = await this.campaignRepository.listApprovedByShopId(
      shop.id,
    );
    return mapPublicShopCampaignHighlights(campaigns);
  }

  async getDetail(slug: string, campaignSlug: string, lang: string) {
    const shop = await this.requireActiveShop(slug);
    const campaign = await this.campaignRepository.findApprovedByShopSlug(
      shop.id,
      campaignSlug,
    );
    if (!campaign) throw new NotFoundException('Campaign not found');

    const base = mapPublicShopCampaign(campaign, lang);
    const products =
      campaign.products
        ?.map((link) => link.product)
        .filter((p) => p && p.status === ProductStatusEnum.ACTIVE)
        .map((product) => {
          const translation = resolveTranslation(product.translations, lang);
          const variant = product.variants?.[0];
          return {
            id: product.id,
            slug: product.slug,
            name: translation?.name ?? '',
            thumbnailUrl: product.thumbnail?.url ?? '',
            price: variant?.price ?? 0,
          };
        }) ?? [];

    return { ...base, slug: campaign.slug, products };
  }

  private async requireActiveShop(slug: string) {
    const shop = await this.shopRepository.getShopBySlug(slug);
    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }
}
