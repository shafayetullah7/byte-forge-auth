import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '@/_repositories/review/review.repository/review.repository';
import { ShopRepository } from '@/modules/shop/repositories';
import { SellerReviewQueryDto } from './dto/seller-review-query.dto';
import { ReportReviewDto } from './dto/report-review.dto';
import { mapReviewImages } from '@/common/utils/map-review-images.util';
import type { ReviewWithPublicRelations } from '@/_repositories/review/review.repository/review.repository.types';

@Injectable()
export class SellerReviewsService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly shopRepository: ShopRepository,
  ) {}

  async getProductReviews(
    userId: string,
    productId: string,
    query: SellerReviewQueryDto,
  ) {
    const shop = await this.resolveShop(userId);
    await this.assertProductOwnership(shop.id, productId);

    const [summary, reviews] = await Promise.all([
      this.reviewRepository.getProductReviewSummary(productId, false),
      this.reviewRepository.listProductReviews(productId, query),
    ]);

    return {
      summary,
      reviews: reviews.data.map((review) => this.mapSellerReview(review)),
      meta: reviews.meta,
    };
  }

  async reportReview(userId: string, reviewId: string, body: ReportReviewDto) {
    const shop = await this.resolveShop(userId);
    const review = await this.reviewRepository.getReviewByIdForSeller(reviewId);

    if (!review || !review.product) {
      throw new NotFoundException('Review not found');
    }

    if (review.product.shopId !== shop.id) {
      throw new NotFoundException('Review not found');
    }

    return this.reviewRepository.createReviewReport({
      reviewId,
      reportedBySellerUserId: userId,
      reason: body.reason,
      details: body.details,
    });
  }

  private mapSellerReview(review: ReviewWithPublicRelations) {
    return {
      id: review.id,
      productId: review.productId,
      orderItemId: review.orderItemId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      customerName: review.user
        ? `${review.user.firstName} ${review.user.lastName}`.trim()
        : 'Buyer',
      images: mapReviewImages(review.images),
    };
  }

  private async resolveShop(userId: string) {
    const shop = await this.shopRepository.getShopByOwnerId(userId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  private async assertProductOwnership(shopId: string, productId: string) {
    const ownsProduct = await this.reviewRepository.assertSellerOwnsProduct(
      shopId,
      productId,
    );

    if (!ownsProduct) {
      throw new NotFoundException('Product not found');
    }
  }
}
