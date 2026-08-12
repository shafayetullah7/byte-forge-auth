import { Injectable } from '@nestjs/common';
import { mapBuyerReview } from '../../mappers/buyer-reviews.mapper';
import { ReviewRepository } from '../../repositories/review.repository';
import type { ReviewListParams } from '../../repositories/review.repository.types';

@Injectable()
export class ListBuyerReviewsQuery {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(userId: string, query: ReviewListParams, lang: string) {
    const result = await this.reviewRepository.listBuyerReviews(userId, query);

    return {
      data: result.data.map((review) => mapBuyerReview(review, lang)),
      meta: result.meta,
    };
  }
}
