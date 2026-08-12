import { Injectable } from '@nestjs/common';
import { ListCampaignsQueryDto } from '../../controllers/dto/list-campaigns-query.dto';
import { mapSellerCampaignListItem } from '../../mappers/seller-campaigns.mapper';
import { CampaignRepository } from '../../repositories/campaign.repository';

@Injectable()
export class ListSellerCampaignsQuery {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(shopId: string, query: ListCampaignsQueryDto) {
    const result = await this.campaignRepository.listByShopId(shopId, query);
    return {
      data: result.data.map(mapSellerCampaignListItem),
      meta: result.meta,
    };
  }
}
