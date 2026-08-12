import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopStatusEnum } from '@/_db/drizzle/enum';
import { ShopQueryService } from '@/modules/shop/application/queries/shop.query';
import { mapPublicShopCampaignHighlights } from '../../mappers/public-shop-campaign.mapper';
import { CampaignRepository } from '../../repositories/campaign.repository';

@Injectable()
export class GetPublicShopCampaignHighlightsQuery {
  constructor(
    private readonly shopQueryService: ShopQueryService,
    private readonly campaignRepository: CampaignRepository,
  ) {}

  async execute(slug: string) {
    const shop = await this.requireActiveShop(slug);
    const campaigns = await this.campaignRepository.listApprovedByShopId(
      shop.id,
    );
    return mapPublicShopCampaignHighlights(campaigns);
  }

  private async requireActiveShop(slug: string) {
    const shop = await this.shopQueryService.getShopBySlug(slug);
    if (!shop || shop.status !== ShopStatusEnum.ACTIVE) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }
}
