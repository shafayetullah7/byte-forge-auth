import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from '../../repositories/review.repository';

export type CreateBuyerReviewParams = {
  orderItemId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
};

@Injectable()
export class CreateBuyerReviewCommand {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(userId: string, params: CreateBuyerReviewParams) {
    const result = await this.reviewRepository.createVerifiedPurchaseReview({
      userId,
      orderItemId: params.orderItemId,
      rating: params.rating,
      title: params.title,
      comment: params.comment,
    });

    if (result.kind === 'NOT_FOUND') {
      throw new NotFoundException('Order item not found');
    }

    if (result.kind === 'NOT_REVIEWABLE') {
      throw new BadRequestException(
        'This order item is not eligible for review yet',
      );
    }

    if (result.kind === 'ALREADY_REVIEWED') {
      throw new ConflictException('This order item has already been reviewed');
    }

    return result.review;
  }
}
