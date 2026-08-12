import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '../../repositories/review.repository';

@Injectable()
export class FeatureReviewCommand {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(reviewId: string, adminId: string) {
    const review = await this.reviewRepository.setReviewFeatured(
      reviewId,
      adminId,
      true,
    );
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }
}
