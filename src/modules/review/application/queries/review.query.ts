import { Injectable } from '@nestjs/common';
import { ReviewRepository } from '../../repositories/review.repository';
import type { ReviewListParams } from '../../repositories/review.repository.types';

/**
 * Cross-module read facade for order enrichment, shop public reviews, and other callers.
 */
@Injectable()
export class ReviewQueryService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  getReviewStatusesForOrderItems(orderItemIds: string[]) {
    return this.reviewRepository.getReviewStatusesForOrderItems(orderItemIds);
  }

  getShopReviewSummary(shopId: string) {
    return this.reviewRepository.getShopReviewSummary(shopId);
  }

  listPublicShopReviews(shopId: string, params: ReviewListParams = {}) {
    return this.reviewRepository.listPublicShopReviews(shopId, params);
  }
}
