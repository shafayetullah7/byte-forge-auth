import { Injectable, NotFoundException } from '@nestjs/common';
import { mapAdminCampaignDetail } from '../../mappers/admin-campaigns.mapper';
import { CampaignRepository } from '../../repositories/campaign.repository';

@Injectable()
export class GetAdminCampaignQuery {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(campaignId: string) {
    const campaign = await this.campaignRepository.findByIdForAdmin(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return mapAdminCampaignDetail(campaign);
  }
}
