import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { RejectCampaignDto } from '../../controllers/dto/reject-campaign.dto';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { GetAdminCampaignQuery } from '../queries/get-admin-campaign.query';

@Injectable()
export class RejectCampaignCommand {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly getAdminCampaignQuery: GetAdminCampaignQuery,
  ) {}

  async execute(campaignId: string, adminId: string, dto: RejectCampaignDto) {
    const campaign = await this.campaignRepository.findByIdForAdmin(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.moderationStatus !== ShopContentModerationStatusEnum.PENDING) {
      throw new BadRequestException('Only pending campaigns can be rejected');
    }

    const updated = await this.campaignRepository.updateModerationStatus(
      campaignId,
      ShopContentModerationStatusEnum.REJECTED,
      {
        rejectedReason: dto.reason,
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
