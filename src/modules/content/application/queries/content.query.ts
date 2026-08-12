import { Injectable } from '@nestjs/common';
import { ArticleRepository } from '../../repositories/article.repository';
import { CampaignRepository } from '../../repositories/campaign.repository';

/**
 * Cross-module read facade for shop analytics and other callers.
 */
@Injectable()
export class ContentQueryService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly campaignRepository: CampaignRepository,
  ) {}

  countApprovedArticlesByShopId(shopId: string) {
    return this.articleRepository.countApprovedByShopId(shopId);
  }

  countApprovedCampaignsByShopId(shopId: string) {
    return this.campaignRepository.countApprovedByShopId(shopId);
  }
}
