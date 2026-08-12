import type { TReviewStatus } from '@/_db/drizzle/enum';

export interface ReviewEntityProps {
  id: string;
  userId: string;
  orderItemId: string;
  productId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  status: TReviewStatus;
  isFeatured: boolean;
  featuredAt: Date | null;
  featuredByAdminId: string | null;
  isRemovedByAdmin: boolean;
  removedByAdminAt: Date | null;
  removedByAdminId: string | null;
  removedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Review {
  readonly id: string;
  readonly userId: string;
  readonly orderItemId: string;
  readonly productId: string;
  readonly rating: number;
  readonly title: string | null;
  readonly comment: string | null;
  readonly isVerifiedPurchase: boolean;
  status: TReviewStatus;
  isFeatured: boolean;
  featuredAt: Date | null;
  featuredByAdminId: string | null;
  isRemovedByAdmin: boolean;
  removedByAdminAt: Date | null;
  removedByAdminId: string | null;
  removedReason: string | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: ReviewEntityProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.orderItemId = props.orderItemId;
    this.productId = props.productId;
    this.rating = props.rating;
    this.title = props.title;
    this.comment = props.comment;
    this.isVerifiedPurchase = props.isVerifiedPurchase;
    this.status = props.status;
    this.isFeatured = props.isFeatured;
    this.featuredAt = props.featuredAt;
    this.featuredByAdminId = props.featuredByAdminId;
    this.isRemovedByAdmin = props.isRemovedByAdmin;
    this.removedByAdminAt = props.removedByAdminAt;
    this.removedByAdminId = props.removedByAdminId;
    this.removedReason = props.removedReason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
