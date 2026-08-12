import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopQueryService } from '@/modules/shop/application/queries/shop.query';
import { ReviewRepository } from '../../repositories/review.repository';

export type ReportSellerReviewParams = {
  reason: string;
  details?: string | null;
};

@Injectable()
export class ReportSellerReviewCommand {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly shopQueryService: ShopQueryService,
  ) {}

  async execute(
    userId: string,
    reviewId: string,
    params: ReportSellerReviewParams,
  ) {
    const shop = await this.shopQueryService.getShopByOwnerId(userId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const review = await this.reviewRepository.getReviewByIdForSeller(reviewId);
    if (!review?.product) {
      throw new NotFoundException('Review not found');
    }

    if (review.product.shopId !== shop.id) {
      throw new NotFoundException('Review not found');
    }

    return this.reviewRepository.createReviewReport({
      reviewId,
      reportedBySellerUserId: userId,
      reason: params.reason,
      details: params.details,
    });
  }
}
