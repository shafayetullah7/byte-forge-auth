import { Injectable } from '@nestjs/common';
import { ReviewRepository } from '@/_repositories/review/review.repository/review.repository';

/** Bridges Order reads to Review data until ReviewModule exposes ReviewQueryService (Phase 38+). */
@Injectable()
export class OrderReviewIntegration {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  getReviewStatusesForOrderItems(orderItemIds: string[]) {
    return this.reviewRepository.getReviewStatusesForOrderItems(orderItemIds);
  }
}
