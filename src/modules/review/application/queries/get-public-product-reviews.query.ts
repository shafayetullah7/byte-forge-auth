import { Injectable } from '@nestjs/common';
import { mapPublicReview } from '../../mappers/public-reviews.mapper';
import { ReviewRepository } from '../../repositories/review.repository';
import type { ReviewListParams } from '../../repositories/review.repository.types';

@Injectable()
export class GetPublicProductReviewsQuery {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(productId: string, query: ReviewListParams) {
    const [summary, reviews] = await Promise.all([
      this.reviewRepository.getProductReviewSummary(productId, true),
      this.reviewRepository.listPublicProductReviews(productId, query),
    ]);

    return {
      summary,
      reviews: reviews.data.map((review) => mapPublicReview(review)),
      meta: reviews.meta,
    };
  }
}
