import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertDeletableCampaignStatus } from '../../domain/campaign-policy';
import { CampaignRepository } from '../../repositories/campaign.repository';

@Injectable()
export class DeleteCampaignCommand {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(shopId: string, campaignId: string) {
    const existing = await this.campaignRepository.findByIdForShop(
      shopId,
      campaignId,
    );
    if (!existing) throw new NotFoundException('Campaign not found');
    if (!assertDeletableCampaignStatus(existing.moderationStatus)) {
      throw new BadRequestException('Approved campaigns cannot be deleted');
    }

    await this.campaignRepository.deleteCampaign(shopId, campaignId);
    return { id: campaignId };
  }
}
