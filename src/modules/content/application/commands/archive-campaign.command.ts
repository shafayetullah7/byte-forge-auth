import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { mapSellerCampaign } from '../../mappers/seller-campaigns.mapper';
import { CampaignRepository } from '../../repositories/campaign.repository';

@Injectable()
export class ArchiveCampaignCommand {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(shopId: string, campaignId: string) {
    const existing = await this.campaignRepository.findByIdForShop(
      shopId,
      campaignId,
    );
    if (!existing) throw new NotFoundException('Campaign not found');

    await this.campaignRepository.updateModerationStatus(
      campaignId,
      ShopContentModerationStatusEnum.ARCHIVED,
    );

    const campaign = await this.campaignRepository.findByIdForShop(
      shopId,
      campaignId,
    );
    return mapSellerCampaign(campaign!);
  }
}
