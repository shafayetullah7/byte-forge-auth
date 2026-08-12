import { mapReviewImages } from '@/libs/utils/map-review-images.util';
import type { ReviewWithPublicRelations } from '../repositories/review.repository.types';

export function mapSellerReview(review: ReviewWithPublicRelations) {
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
