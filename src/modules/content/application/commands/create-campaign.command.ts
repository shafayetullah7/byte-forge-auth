import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';
import { CreateCampaignDto } from '../../controllers/dto/create-campaign.dto';
import { mapSellerCampaign } from '../../mappers/seller-campaigns.mapper';
import { CampaignRepository } from '../../repositories/campaign.repository';

@Injectable()
export class CreateCampaignCommand {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(shopId: string, dto: CreateCampaignDto) {
    const productIds = dto.productIds ?? [];
    if (productIds.length > 0) {
      const valid = await this.campaignRepository.validateProductIdsForShop(
        shopId,
        productIds,
      );
      if (!valid) {
        throw new BadRequestException(
          'One or more products are invalid or not active',
        );
      }
    }

    const slug =
      dto.slug ??
      (await this.campaignRepository.generateUniqueSlug(
        shopId,
        dto.translations.en.title,
      ));

    if (dto.slug) {
      const taken = await this.campaignRepository.slugExists(shopId, dto.slug);
      if (taken) throw new ConflictException('Slug already exists');
    }

    const translations = {
      en: dto.translations.en,
      bn: dto.translations.bn ?? {
        title: dto.translations.en.title,
        description: dto.translations.en.description ?? null,
      },
    };

    const campaign = await this.campaignRepository.createCampaign(
      {
        shopId,
        slug,
        type: dto.type,
        bannerId: dto.bannerId ?? null,
        discountPercent: dto.discountPercent ?? null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        moderationStatus: ShopContentModerationStatusEnum.DRAFT,
      },
      translations,
      productIds,
    );

    if (!campaign) throw new NotFoundException('Campaign not found');
    return mapSellerCampaign(campaign);
  }
}
