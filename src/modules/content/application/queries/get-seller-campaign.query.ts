import { Injectable, NotFoundException } from '@nestjs/common';
import { mapSellerCampaign } from '../../mappers/seller-campaigns.mapper';
import { CampaignRepository } from '../../repositories/campaign.repository';

@Injectable()
export class GetSellerCampaignQuery {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(shopId: string, campaignId: string) {
    const campaign = await this.campaignRepository.findByIdForShop(
      shopId,
      campaignId,
    );
    if (!campaign) throw new NotFoundException('Campaign not found');
    return mapSellerCampaign(campaign);
  }
}
