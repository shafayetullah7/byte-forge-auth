import { Injectable, NotFoundException } from '@nestjs/common';
import { mapAdminReview } from '../../mappers/admin-reviews.mapper';
import { ReviewRepository } from '../../repositories/review.repository';

@Injectable()
export class GetAdminReviewQuery {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(reviewId: string, lang: string) {
    const review = await this.reviewRepository.getReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return mapAdminReview(review, lang);
  }
}
