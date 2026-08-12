import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatusEnum, ShopStatusEnum } from '@/_db/drizzle/enum';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { ShopQueryService } from '@/modules/shop/application/queries/shop.query';
import { mapPublicShopCampaign } from '../../mappers/public-shop-campaign.mapper';
import { CampaignRepository } from '../../repositories/campaign.repository';

@Injectable()
export class GetPublicShopCampaignQuery {
  constructor(
    private readonly shopQueryService: ShopQueryService,
    private readonly campaignRepository: CampaignRepository,
  ) {}

  async execute(slug: string, campaignSlug: string, lang: string) {
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
    const shop = await this.shopQueryService.getShopBySlug(slug);
    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }
}
