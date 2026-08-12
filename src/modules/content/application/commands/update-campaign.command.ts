import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateCampaignDto } from '../../controllers/dto/update-campaign.dto';
import { assertEditableCampaignStatus } from '../../domain/campaign-policy';
import { mapSellerCampaign } from '../../mappers/seller-campaigns.mapper';
import { CampaignRepository } from '../../repositories/campaign.repository';
import type { CampaignTranslationInput } from '../../repositories/campaign.repository.types';

@Injectable()
export class UpdateCampaignCommand {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(shopId: string, campaignId: string, dto: UpdateCampaignDto) {
    const existing = await this.campaignRepository.findByIdForShop(
      shopId,
      campaignId,
    );
    if (!existing) throw new NotFoundException('Campaign not found');
    if (!assertEditableCampaignStatus(existing.moderationStatus)) {
      throw new BadRequestException(
        'Campaign cannot be edited in current status',
      );
    }

    if (dto.productIds) {
      const valid = await this.campaignRepository.validateProductIdsForShop(
        shopId,
        dto.productIds,
      );
      if (!valid) {
        throw new BadRequestException(
          'One or more products are invalid or not active',
        );
      }
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const taken = await this.campaignRepository.slugExists(
        shopId,
        dto.slug,
        campaignId,
      );
      if (taken) throw new ConflictException('Slug already exists');
    }

    const campaign = await this.campaignRepository.updateCampaign(
      shopId,
      campaignId,
      {
        slug: dto.slug,
        type: dto.type,
        bannerId: dto.bannerId,
        discountPercent: dto.discountPercent,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      dto.translations as CampaignTranslationInput | undefined,
      dto.productIds,
    );

    if (!campaign) throw new NotFoundException('Campaign not found');
    return mapSellerCampaign(campaign);
  }
}
