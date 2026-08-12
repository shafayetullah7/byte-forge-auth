import type { TProductTranslation } from '@/_db/drizzle/schema';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { mapReviewImages } from '@/common/utils/map-review-images.util';
import type { ReviewWithBuyerRelations } from '../repositories/review.repository.types';

export function mapBuyerReview(review: ReviewWithBuyerRelations, lang: string) {
  return {
    id: review.id,
    orderItemId: review.orderItemId,
    productId: review.productId,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isVerifiedPurchase: review.isVerifiedPurchase,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    product: review.product
      ? {
          id: review.product.id,
          slug: review.product.slug,
          name:
            resolveTranslation<TProductTranslation>(
              review.product.translations,
              lang,
            )?.name ?? 'Product',
          thumbnail: review.product.thumbnail
            ? {
                id: review.product.thumbnail.id,
                url: review.product.thumbnail.url,
              }
            : null,
        }
      : null,
    images: mapReviewImages(review.images),
  };
}
