import { Injectable } from '@nestjs/common';
import { ReviewRepository } from '../../repositories/review.repository';

@Injectable()
export class GetBuyerReviewEligibilityQuery {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  execute(userId: string, orderItemId: string) {
    return this.reviewRepository.getBuyerEligibility(userId, orderItemId);
  }
}
