import { mapReviewImages } from '@/libs/utils/map-review-images.util';
import type {
  ReviewImageWithMedia,
  ReviewWithFeaturedRelations,
  ReviewWithPublicRelations,
} from '../repositories/review.repository.types';

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

export function mapPublicReview(review: MappablePublicReview) {
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

export function mapFeaturedPublicReview(review: ReviewWithFeaturedRelations) {
  return {
    ...mapPublicReview(review),
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
