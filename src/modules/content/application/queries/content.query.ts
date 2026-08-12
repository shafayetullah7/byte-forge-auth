import { Injectable } from '@nestjs/common';
import { ArticleRepository } from '../../repositories/article.repository';

/**
 * Cross-module read facade for shop analytics and other callers.
 */
@Injectable()
export class ContentQueryService {
  constructor(private readonly articleRepository: ArticleRepository) {}

  countApprovedByShopId(shopId: string) {
    return this.articleRepository.countApprovedByShopId(shopId);
  }
}
