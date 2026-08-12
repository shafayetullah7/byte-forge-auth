import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { mapReviewImages } from '@/libs/utils/map-review-images.util';
import type {
  TProductTranslation,
  TShopTranslation,
} from '@/_db/drizzle/schema';
import type { ReviewWithAdminRelations } from '../repositories/review.repository.types';

export function mapAdminReview(review: ReviewWithAdminRelations, lang: string) {
  const productTranslation = review.product
    ? resolveTranslation<TProductTranslation>(review.product.translations, lang)
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
