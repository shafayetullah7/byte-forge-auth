import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopQueryService } from '@/modules/shop/application/queries/shop.query';
import { mapSellerReview } from '../../mappers/seller-reviews.mapper';
import { ReviewRepository } from '../../repositories/review.repository';
import type { ReviewListParams } from '../../repositories/review.repository.types';

@Injectable()
export class ListSellerProductReviewsQuery {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly shopQueryService: ShopQueryService,
  ) {}

  async execute(userId: string, productId: string, query: ReviewListParams) {
    const shop = await this.shopQueryService.getShopByOwnerId(userId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const ownsProduct = await this.reviewRepository.assertSellerOwnsProduct(
      shop.id,
      productId,
    );
    if (!ownsProduct) {
      throw new NotFoundException('Product not found');
    }

    const [summary, reviews] = await Promise.all([
      this.reviewRepository.getProductReviewSummary(productId, false),
      this.reviewRepository.listProductReviews(productId, query),
    ]);

    return {
      summary,
      reviews: reviews.data.map((review) => mapSellerReview(review)),
      meta: reviews.meta,
    };
  }
}
