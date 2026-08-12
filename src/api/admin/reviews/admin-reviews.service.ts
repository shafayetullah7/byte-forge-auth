import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '@/modules/review/repositories/review.repository';
import { AdminReviewQueryDto } from './dto/admin-review-query.dto';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { mapReviewImages } from '@/common/utils/map-review-images.util';
import type {
  TProductTranslation,
  TShopTranslation,
} from '@/_db/drizzle/schema';
import type { ReviewWithAdminRelations } from '@/modules/review/repositories/review.repository.types';

@Injectable()
export class AdminReviewsService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async listReviews(query: AdminReviewQueryDto, lang: string) {
    const result = await this.reviewRepository.listAdminReviews(query);
    return {
      data: result.data.map((review) => this.mapAdminReview(review, lang)),
      meta: result.meta,
    };
  }

  async getReview(reviewId: string, lang: string) {
    const review = await this.reviewRepository.getReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.mapAdminReview(review, lang);
  }

  async featureReview(reviewId: string, adminId: string) {
    return this.requireReview(
      this.reviewRepository.setReviewFeatured(reviewId, adminId, true),
    );
  }

  async unfeatureReview(reviewId: string) {
    return this.requireReview(
      this.reviewRepository.setReviewFeatured(reviewId, '', false),
    );
  }

  async removeReview(reviewId: string, adminId: string, reason: string) {
    return this.requireReview(
      this.reviewRepository.setReviewRemovedByAdmin(
        reviewId,
        adminId,
        true,
        reason,
      ),
    );
  }

  async restoreReview(reviewId: string) {
    return this.requireReview(
      this.reviewRepository.setReviewRemovedByAdmin(reviewId, '', false),
    );
  }

  async updateReportStatus(
    reportId: string,
    status: 'OPEN' | 'RESOLVED' | 'DISMISSED',
    adminId: string,
  ) {
    const report = await this.reviewRepository.updateReviewReportStatus(
      reportId,
      status,
      adminId,
    );

    if (!report) {
      throw new NotFoundException('Review report not found');
    }

    return report;
  }

  private mapAdminReview(review: ReviewWithAdminRelations, lang: string) {
    const productTranslation = review.product
      ? resolveTranslation<TProductTranslation>(
          review.product.translations,
          lang,
        )
      : null;
    const shopTranslation = review.product?.shop
      ? resolveTranslation<TShopTranslation>(
          review.product.shop.translations,
          lang,
        )
      : null;

    return {
      id: review.id,
      userId: review.userId,
      orderItemId: review.orderItemId,
      productId: review.productId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      status: review.status,
      isFeatured: review.isFeatured,
      isRemovedByAdmin: review.isRemovedByAdmin,
      removedReason: review.removedReason,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      customer: review.user
        ? {
            id: review.user.id,
            name: `${review.user.firstName} ${review.user.lastName}`.trim(),
            userName: review.user.userName,
          }
        : null,
      product: review.product
        ? {
            id: review.product.id,
            slug: review.product.slug,
            name: productTranslation?.name ?? 'Product',
            thumbnail: review.product.thumbnail
              ? {
                  id: review.product.thumbnail.id,
                  url: review.product.thumbnail.url,
                }
              : null,
            shop: review.product.shop
              ? {
                  id: review.product.shop.id,
                  slug: review.product.shop.slug,
                  name: shopTranslation?.name ?? 'Shop',
                }
              : null,
          }
        : null,
      order: review.orderItem?.order
        ? {
            id: review.orderItem.order.id,
            orderNumber: review.orderItem.order.orderNumber,
            status: review.orderItem.order.status,
          }
        : null,
      images: mapReviewImages(review.images),
      reports: review.reports.map((report) => ({
        id: report.id,
        reason: report.reason,
        details: report.details,
        status: report.status,
        createdAt: report.createdAt,
        reportedBySeller: report.reportedBySeller
          ? {
              id: report.reportedBySeller.id,
              name: `${report.reportedBySeller.firstName} ${report.reportedBySeller.lastName}`.trim(),
              userName: report.reportedBySeller.userName,
            }
          : null,
      })),
    };
  }

  private async requireReview<T>(promise: Promise<T | null>) {
    const review = await promise;
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }
}
