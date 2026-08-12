import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { GetAdminCampaignQuery } from '../queries/get-admin-campaign.query';

@Injectable()
export class ApproveCampaignCommand {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly getAdminCampaignQuery: GetAdminCampaignQuery,
  ) {}

  async execute(campaignId: string, adminId: string) {
    const campaign = await this.campaignRepository.findByIdForAdmin(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.moderationStatus !== ShopContentModerationStatusEnum.PENDING) {
      throw new BadRequestException('Only pending campaigns can be approved');
    }

    const updated = await this.campaignRepository.updateModerationStatus(
      campaignId,
      ShopContentModerationStatusEnum.APPROVED,
      {
        rejectedReason: null,
        moderatedByAdminId: adminId,
        moderatedAt: new Date(),
      },
    );

    if (!updated) {
      throw new NotFoundException('Campaign not found');
    }

    return this.getAdminCampaignQuery.execute(campaignId);
  }
}
