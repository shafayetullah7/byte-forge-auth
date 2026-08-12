import { Injectable } from '@nestjs/common';
import { AdminCampaignsQueryDto } from '../../controllers/dto/admin-campaigns-query.dto';
import {
  mapAdminCampaignListItem,
  type CampaignAdminRow,
} from '../../mappers/admin-campaigns.mapper';
import { CampaignRepository } from '../../repositories/campaign.repository';

@Injectable()
export class ListAdminCampaignsQuery {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(query: AdminCampaignsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result = await this.campaignRepository.listAdmin({
      page,
      limit,
      search: query.search,
      moderationStatus: query.moderationStatus,
    });

    return {
      data: result.data.map((campaign) =>
        mapAdminCampaignListItem(campaign as CampaignAdminRow),
      ),
      meta: result.meta,
    };
  }
}
