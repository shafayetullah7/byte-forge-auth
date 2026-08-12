import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '../../repositories/review.repository';

@Injectable()
export class UnfeatureReviewCommand {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(reviewId: string) {
    const review = await this.reviewRepository.setReviewFeatured(
      reviewId,
      '',
      false,
    );
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }
}
