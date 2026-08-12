import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '@/modules/review/repositories/review.repository';
import { PublicReviewQueryDto } from './dto/public-review-query.dto';
import { mapReviewImages } from '@/common/utils/map-review-images.util';
import type {
  ReviewImageWithMedia,
  ReviewWithFeaturedRelations,
  ReviewWithPublicRelations,
} from '@/modules/review/repositories/review.repository.types';

type MappablePublicReview = Pick<
  ReviewWithPublicRelations,
  | 'id'
  | 'productId'
  | 'rating'
  | 'title'
  | 'comment'
  | 'isVerifiedPurchase'
  | 'createdAt'
  | 'user'
> & {
  images?: ReviewImageWithMedia[];
};

@Injectable()
export class PublicReviewsService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async getProductReviews(productId: string, query: PublicReviewQueryDto) {
    const [summary, reviews] = await Promise.all([
      this.reviewRepository.getProductReviewSummary(productId, true),
      this.reviewRepository.listPublicProductReviews(productId, query),
    ]);

    return {
      summary,
      reviews: reviews.data.map((review) => this.mapPublicReview(review)),
      meta: reviews.meta,
    };
  }

  async getPlantReviews(slug: string, query: PublicReviewQueryDto) {
    const productId = await this.reviewRepository.getProductIdBySlug(slug);
    if (!productId) {
      throw new NotFoundException('Plant not found');
    }

    return this.getProductReviews(productId, query);
  }

  async getFeaturedReviews(limit = 10) {
    const rows = await this.reviewRepository.listFeaturedPublicReviews(limit);
    return rows.map((review) => this.mapFeaturedReview(review));
  }

  private mapFeaturedReview(review: ReviewWithFeaturedRelations) {
    return {
      ...this.mapPublicReview(review),
      product: review.product
        ? {
            id: review.product.id,
            slug: review.product.slug,
            thumbnail: review.product.thumbnail
              ? {
                  id: review.product.thumbnail.id,
                  url: review.product.thumbnail.url,
                }
              : null,
          }
        : null,
      featuredAt: review.featuredAt,
    };
  }

  private mapPublicReview(review: MappablePublicReview) {
    const customerName = review.user
      ? `${review.user.firstName} ${review.user.lastName}`.trim()
      : 'Verified buyer';

    return {
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt,
      customerName,
      images: mapReviewImages(review.images),
    };
  }
}
