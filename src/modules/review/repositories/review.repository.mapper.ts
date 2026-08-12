import type {
  TNewReview,
  TReview,
} from '@/_db/drizzle/schema/review/reviews.schema';
import { Review, type ReviewEntityProps } from '../domain/review.entity';

export function mapReviewRowToEntity(row: TReview): Review {
  return new Review({
    id: row.id,
    userId: row.userId,
    orderItemId: row.orderItemId,
    productId: row.productId,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    isVerifiedPurchase: row.isVerifiedPurchase,
    status: row.status,
    isFeatured: row.isFeatured,
    featuredAt: row.featuredAt,
    featuredByAdminId: row.featuredByAdminId,
    isRemovedByAdmin: row.isRemovedByAdmin,
    removedByAdminAt: row.removedByAdminAt,
    removedByAdminId: row.removedByAdminId,
    removedReason: row.removedReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function mapReviewEntityToNewRow(
  review: Review,
): Omit<TNewReview, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId: review.userId,
    orderItemId: review.orderItemId,
    productId: review.productId,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isVerifiedPurchase: review.isVerifiedPurchase,
    status: review.status,
    isFeatured: review.isFeatured,
    featuredAt: review.featuredAt,
    featuredByAdminId: review.featuredByAdminId,
    isRemovedByAdmin: review.isRemovedByAdmin,
    removedByAdminAt: review.removedByAdminAt,
    removedByAdminId: review.removedByAdminId,
    removedReason: review.removedReason,
  };
}

export function mapReviewEntityToUpdatePatch(
  review: Review,
): Pick<
  TReview,
  | 'status'
  | 'isFeatured'
  | 'featuredAt'
  | 'featuredByAdminId'
  | 'isRemovedByAdmin'
  | 'removedByAdminAt'
  | 'removedByAdminId'
  | 'removedReason'
  | 'updatedAt'
> {
  return {
    status: review.status,
    isFeatured: review.isFeatured,
    featuredAt: review.featuredAt,
    featuredByAdminId: review.featuredByAdminId,
    isRemovedByAdmin: review.isRemovedByAdmin,
    removedByAdminAt: review.removedByAdminAt,
    removedByAdminId: review.removedByAdminId,
    removedReason: review.removedReason,
    updatedAt: review.updatedAt,
  };
}

export type { ReviewEntityProps };
