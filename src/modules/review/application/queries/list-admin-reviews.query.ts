import { Injectable } from '@nestjs/common';
import { mapAdminReview } from '../../mappers/admin-reviews.mapper';
import { ReviewRepository } from '../../repositories/review.repository';
import type { ReviewListParams } from '../../repositories/review.repository.types';

@Injectable()
export class ListAdminReviewsQuery {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(query: ReviewListParams, lang: string) {
    const result = await this.reviewRepository.listAdminReviews(query);

    return {
      data: result.data.map((review) => mapAdminReview(review, lang)),
      meta: result.meta,
    };
  }
}
