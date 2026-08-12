import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '../../repositories/review.repository';

@Injectable()
export class RemoveReviewCommand {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(reviewId: string, adminId: string, reason: string) {
    const review = await this.reviewRepository.setReviewRemovedByAdmin(
      reviewId,
      adminId,
      true,
      reason,
    );
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }
}
