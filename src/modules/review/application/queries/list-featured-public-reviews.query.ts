import { Injectable } from '@nestjs/common';
import { mapFeaturedPublicReview } from '../../mappers/public-reviews.mapper';
import { ReviewRepository } from '../../repositories/review.repository';

@Injectable()
export class ListFeaturedPublicReviewsQuery {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(limit = 10) {
    const rows = await this.reviewRepository.listFeaturedPublicReviews(limit);
    return rows.map((review) => mapFeaturedPublicReview(review));
  }
}
