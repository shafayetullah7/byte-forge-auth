import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { mapSellerCampaign } from '../../mappers/seller-campaigns.mapper';
import { CampaignRepository } from '../../repositories/campaign.repository';

@Injectable()
export class SubmitCampaignCommand {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(shopId: string, campaignId: string, shopStatus: string) {
    if (shopStatus !== 'ACTIVE') {
      throw new BadRequestException('Shop must be active to submit campaigns');
    }

    const existing = await this.campaignRepository.findByIdForShop(
      shopId,
      campaignId,
    );
    if (!existing) throw new NotFoundException('Campaign not found');

    const editable =
      existing.moderationStatus === ShopContentModerationStatusEnum.DRAFT ||
      existing.moderationStatus === ShopContentModerationStatusEnum.REJECTED;
    if (!editable) {
      throw new BadRequestException('Campaign cannot be submitted');
    }

    const en = existing.translations.find((t) => t.locale === 'en');
    const bn = existing.translations.find((t) => t.locale === 'bn');
    if (!en?.title?.trim() || !bn?.title?.trim()) {
      throw new BadRequestException(
        'English and Bengali titles are required to submit',
      );
    }

    const updated = await this.campaignRepository.updateModerationStatus(
      campaignId,
      ShopContentModerationStatusEnum.PENDING,
      { rejectedReason: null },
    );

    const campaign = await this.campaignRepository.findByIdForShop(
      shopId,
      updated.id,
    );
    return mapSellerCampaign(campaign!);
  }
}
