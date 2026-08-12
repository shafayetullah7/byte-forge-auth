import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, SQL, sql } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  orderItemsTable,
  productsTable,
  reviewReportsTable,
  reviewImagesTable,
  reviewsTable,
  TNewReviewReport,
  TNewReview,
  TReviewReport,
  TReview,
} from '@/_db/drizzle/schema';
import { ReviewStatusEnum, type TReviewStatus } from '@/_db/drizzle/enum';
import { REVIEWABLE_ORDER_STATUSES } from '../domain/review-policy';
import { mapReviewRowToEntity } from './review.repository.mapper';
import type {
  CreateReviewInput,
  CreateReviewReportInput,
  ReviewListParams,
  ReviewPaginatedResult,
  ReviewWithAdminRelations,
  ReviewWithBuyerRelations,
  ReviewWithFeaturedRelations,
  ReviewWithPublicRelations,
} from './review.repository.types';
import type { Review } from '../domain/review.entity';

export type {
  CreateReviewInput,
  CreateReviewReportInput,
  ReviewListParams,
} from './review.repository.types';

@Injectable()
export class ReviewRepository {
  constructor(private readonly db: DrizzleService) {}

  async getBuyerOrderItemForReview(userId: string, orderItemId: string) {
    return this.db.client.query.orderItemsTable
      .findFirst({
        where: eq(orderItemsTable.id, orderItemId),
        with: {
          order: true,
          product: {
            with: {
              thumbnail: true,
              translations: true,
            },
          },
        },
      })
      .then((item) => {
        if (!item || item.order.userId !== userId) return null;
        return item;
      });
  }

  async getReviewByOrderItemId(orderItemId: string): Promise<TReview | null> {
    const [review] = await this.db.client
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.orderItemId, orderItemId))
      .limit(1);

    return review ?? null;
  }

  async findReviewEntityById(reviewId: string): Promise<Review | null> {
    const [review] = await this.db.client
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, reviewId))
      .limit(1);

    return review ? mapReviewRowToEntity(review) : null;
  }

  async createVerifiedPurchaseReview(input: CreateReviewInput) {
    const item = await this.getBuyerOrderItemForReview(
      input.userId,
      input.orderItemId,
    );

    if (!item) {
      return { kind: 'NOT_FOUND' as const };
    }

    if (!REVIEWABLE_ORDER_STATUSES.includes(item.order.status)) {
      return { kind: 'NOT_REVIEWABLE' as const, item };
    }

    const existing = await this.getReviewByOrderItemId(input.orderItemId);
    if (existing) {
      return { kind: 'ALREADY_REVIEWED' as const, review: existing };
    }

    const payload: TNewReview = {
      userId: input.userId,
      orderItemId: input.orderItemId,
      productId: item.productId,
      rating: input.rating,
      title: input.title?.trim() || null,
      comment: input.comment?.trim() || null,
      isVerifiedPurchase: true,
      status: ReviewStatusEnum.APPROVED,
    };

    const [review] = await this.db.client
      .insert(reviewsTable)
      .values(payload)
      .returning();

    return { kind: 'CREATED' as const, review };
  }

  async getBuyerEligibility(userId: string, orderItemId: string) {
    const item = await this.getBuyerOrderItemForReview(userId, orderItemId);
    if (!item) {
      return {
        canReview: false,
        reason: 'ORDER_ITEM_NOT_FOUND',
        review: null,
        productId: null,
      };
    }

    const review = await this.getReviewByOrderItemId(orderItemId);
    if (review) {
      return {
        canReview: false,
        reason: 'ALREADY_REVIEWED',
        review,
        productId: item.productId,
      };
    }

    if (!REVIEWABLE_ORDER_STATUSES.includes(item.order.status)) {
      return {
        canReview: false,
        reason: 'ORDER_NOT_REVIEWABLE',
        review: null,
        productId: item.productId,
      };
    }

    return {
      canReview: true,
      reason: null,
      review: null,
      productId: item.productId,
    };
  }

  async listBuyerReviews(
    userId: string,
    params: ReviewListParams = {},
  ): Promise<ReviewPaginatedResult<ReviewWithBuyerRelations>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [eq(reviewsTable.userId, userId)];

    if (params.status) conditions.push(eq(reviewsTable.status, params.status));
    if (params.rating) conditions.push(eq(reviewsTable.rating, params.rating));

    const where = and(...conditions);

    const [totalRow] = await this.db.client
      .select({ value: count() })
      .from(reviewsTable)
      .where(where);

    const data: ReviewWithBuyerRelations[] =
      await this.db.client.query.reviewsTable.findMany({
        where,
        limit,
        offset,
        orderBy: desc(reviewsTable.createdAt),
        with: {
          product: {
            with: {
              thumbnail: true,
              translations: true,
            },
          },
          images: {
            orderBy: asc(reviewImagesTable.displayOrder),
            with: {
              media: true,
            },
          },
        },
      });

    return {
      data,
      meta: {
        page,
        limit,
        total: totalRow?.value ?? 0,
        pages: Math.ceil((totalRow?.value ?? 0) / limit),
      },
    };
  }

  async getProductIdBySlug(slug: string) {
    const [product] = await this.db.client
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.slug, slug))
      .limit(1);

    return product?.id ?? null;
  }

  async getProductReviewSummary(productId: string, publicOnly = true) {
    const conditions: SQL[] = [eq(reviewsTable.productId, productId)];
    if (publicOnly) {
      conditions.push(eq(reviewsTable.isRemovedByAdmin, false));
      conditions.push(eq(reviewsTable.status, ReviewStatusEnum.APPROVED));
    }
    const where = and(...conditions);

    const [summary] = await this.db.client
      .select({
        total: count(),
        average: sql<string>`coalesce(avg(${reviewsTable.rating}), 0)`,
      })
      .from(reviewsTable)
      .where(where);

    const distributionRows = await this.db.client
      .select({
        rating: reviewsTable.rating,
        count: count(),
      })
      .from(reviewsTable)
      .where(where)
      .groupBy(reviewsTable.rating);

    const total = Number(summary?.total ?? 0);
    const distribution = [5, 4, 3, 2, 1].map((rating) => {
      const row = distributionRows.find((item) => item.rating === rating);
      const value = Number(row?.count ?? 0);
      return {
        rating,
        count: value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      };
    });

    return {
      total,
      average: Number(summary?.average ?? 0),
      distribution,
    };
  }

  async listProductReviews(
    productId: string,
    params: ReviewListParams = {},
  ): Promise<ReviewPaginatedResult<ReviewWithPublicRelations>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [eq(reviewsTable.productId, productId)];

    if (params.status) conditions.push(eq(reviewsTable.status, params.status));
    if (params.rating) conditions.push(eq(reviewsTable.rating, params.rating));
    if (params.minRating)
      conditions.push(sql`${reviewsTable.rating} >= ${params.minRating}`);
    if (params.maxRating)
      conditions.push(sql`${reviewsTable.rating} <= ${params.maxRating}`);
    if (params.featuredOnly === true)
      conditions.push(eq(reviewsTable.isFeatured, true));
    if (params.removedOnly === true)
      conditions.push(eq(reviewsTable.isRemovedByAdmin, true));
    if (params.removedOnly === false)
      conditions.push(eq(reviewsTable.isRemovedByAdmin, false));

    const where = and(...conditions);

    const [totalRow] = await this.db.client
      .select({ value: count() })
      .from(reviewsTable)
      .where(where);

    const data: ReviewWithPublicRelations[] =
      await this.db.client.query.reviewsTable.findMany({
        where,
        limit,
        offset,
        orderBy: desc(reviewsTable.createdAt),
        with: {
          user: true,
          product: {
            with: {
              thumbnail: true,
              translations: true,
            },
          },
          orderItem: {
            with: {
              order: true,
            },
          },
          images: {
            orderBy: asc(reviewImagesTable.displayOrder),
            with: {
              media: true,
            },
          },
          reports: {
            orderBy: desc(reviewReportsTable.createdAt),
          },
        },
      });

    return {
      data,
      meta: {
        page,
        limit,
        total: totalRow?.value ?? 0,
        pages: Math.ceil((totalRow?.value ?? 0) / limit),
      },
    };
  }

  async listPublicProductReviews(
    productId: string,
    params: ReviewListParams = {},
  ): Promise<ReviewPaginatedResult<ReviewWithPublicRelations>> {
    return this.listProductReviews(productId, {
      ...params,
      status: ReviewStatusEnum.APPROVED,
      removedOnly: false,
    });
  }

  async assertSellerOwnsProduct(shopId: string, productId: string) {
    const [product] = await this.db.client
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(
        and(eq(productsTable.id, productId), eq(productsTable.shopId, shopId)),
      )
      .limit(1);

    return Boolean(product);
  }

  async getShopReviewSummary(shopId: string) {
    const shopProductIds = this.db.client
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.shopId, shopId));

    const conditions: SQL[] = [
      eq(reviewsTable.status, ReviewStatusEnum.APPROVED),
      eq(reviewsTable.isRemovedByAdmin, false),
      inArray(reviewsTable.productId, shopProductIds),
    ];
    const where = and(...conditions);

    const [summary] = await this.db.client
      .select({
        total: count(),
        average: sql<string>`coalesce(avg(${reviewsTable.rating}), 0)`,
      })
      .from(reviewsTable)
      .where(where);

    const distributionRows = await this.db.client
      .select({
        rating: reviewsTable.rating,
        count: count(),
      })
      .from(reviewsTable)
      .where(where)
      .groupBy(reviewsTable.rating);

    const total = Number(summary?.total ?? 0);
    const distribution = [5, 4, 3, 2, 1].map((rating) => {
      const row = distributionRows.find((item) => item.rating === rating);
      const value = Number(row?.count ?? 0);
      return {
        rating,
        count: value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      };
    });

    return {
      total,
      average: Number(summary?.average ?? 0),
      distribution,
    };
  }

  async listPublicShopReviews(
    shopId: string,
    params: ReviewListParams = {},
  ): Promise<ReviewPaginatedResult<ReviewWithPublicRelations>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const offset = (page - 1) * limit;

    const shopProductIds = this.db.client
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.shopId, shopId));

    const conditions: SQL[] = [
      eq(reviewsTable.status, ReviewStatusEnum.APPROVED),
      eq(reviewsTable.isRemovedByAdmin, false),
      inArray(reviewsTable.productId, shopProductIds),
    ];
    const where = and(...conditions);

    const [totalRow] = await this.db.client
      .select({ value: count() })
      .from(reviewsTable)
      .where(where);

    const data: ReviewWithPublicRelations[] =
      await this.db.client.query.reviewsTable.findMany({
        where,
        limit,
        offset,
        orderBy: desc(reviewsTable.createdAt),
        with: {
          user: true,
          product: {
            with: {
              thumbnail: true,
              translations: true,
            },
          },
          orderItem: {
            with: {
              order: true,
            },
          },
          images: {
            orderBy: asc(reviewImagesTable.displayOrder),
            with: {
              media: true,
            },
          },
          reports: {
            orderBy: desc(reviewReportsTable.createdAt),
          },
        },
      });

    return {
      data,
      meta: {
        page,
        limit,
        total: totalRow?.value ?? 0,
        pages: Math.ceil((totalRow?.value ?? 0) / limit),
      },
    };
  }

  async getReviewByIdForSeller(reviewId: string) {
    return this.db.client.query.reviewsTable.findFirst({
      where: eq(reviewsTable.id, reviewId),
      with: {
        product: true,
      },
    });
  }

  async createReviewReport(input: CreateReviewReportInput) {
    const payload: TNewReviewReport = {
      reviewId: input.reviewId,
      reportedBySellerUserId: input.reportedBySellerUserId,
      reason: input.reason.trim(),
      details: input.details?.trim() || null,
      status: 'OPEN',
    };

    const [report] = await this.db.client
      .insert(reviewReportsTable)
      .values(payload)
      .returning();

    return report;
  }

  async listReviewReportsForReview(reviewId: string): Promise<TReviewReport[]> {
    return this.db.client
      .select()
      .from(reviewReportsTable)
      .where(eq(reviewReportsTable.reviewId, reviewId))
      .orderBy(desc(reviewReportsTable.createdAt));
  }

  async listAdminReviews(
    params: ReviewListParams = {},
  ): Promise<ReviewPaginatedResult<ReviewWithAdminRelations>> {
    return this.listProductReviewsForAdmin(params);
  }

  async getReviewById(
    reviewId: string,
  ): Promise<ReviewWithAdminRelations | null> {
    const review = await this.db.client.query.reviewsTable.findFirst({
      where: eq(reviewsTable.id, reviewId),
      with: {
        user: true,
        product: {
          with: {
            thumbnail: true,
            translations: true,
            shop: {
              with: {
                translations: true,
              },
            },
          },
        },
        orderItem: {
          with: {
            order: true,
          },
        },
        images: {
          orderBy: asc(reviewImagesTable.displayOrder),
          with: {
            media: true,
          },
        },
        reports: {
          orderBy: desc(reviewReportsTable.createdAt),
          with: {
            reportedBySeller: true,
            resolvedByAdmin: true,
          },
        },
      },
    });

    return review ?? null;
  }

  async updateReviewStatus(reviewId: string, status: TReviewStatus) {
    const [review] = await this.db.client
      .update(reviewsTable)
      .set({ status })
      .where(eq(reviewsTable.id, reviewId))
      .returning();

    return review ?? null;
  }

  async setReviewFeatured(
    reviewId: string,
    adminId: string,
    featured: boolean,
  ) {
    const [review] = await this.db.client
      .update(reviewsTable)
      .set({
        isFeatured: featured,
        featuredAt: featured ? new Date() : null,
        featuredByAdminId: featured ? adminId : null,
      })
      .where(eq(reviewsTable.id, reviewId))
      .returning();

    return review ?? null;
  }

  async setReviewRemovedByAdmin(
    reviewId: string,
    adminId: string,
    removed: boolean,
    removedReason?: string,
  ) {
    const [review] = await this.db.client
      .update(reviewsTable)
      .set({
        isRemovedByAdmin: removed,
        removedByAdminAt: removed ? new Date() : null,
        removedByAdminId: removed ? adminId : null,
        removedReason: removed ? removedReason?.trim() || null : null,
      })
      .where(eq(reviewsTable.id, reviewId))
      .returning();

    return review ?? null;
  }

  async updateReviewReportStatus(
    reportId: string,
    status: 'OPEN' | 'RESOLVED' | 'DISMISSED',
    adminId: string,
  ) {
    const [report] = await this.db.client
      .update(reviewReportsTable)
      .set({
        status,
        resolvedAt: status === 'OPEN' ? null : new Date(),
        resolvedByAdminId: status === 'OPEN' ? null : adminId,
      })
      .where(eq(reviewReportsTable.id, reportId))
      .returning();

    return report ?? null;
  }

  async listFeaturedPublicReviews(
    limit = 10,
  ): Promise<ReviewWithFeaturedRelations[]> {
    return this.db.client.query.reviewsTable.findMany({
      where: and(
        eq(reviewsTable.isFeatured, true),
        eq(reviewsTable.isRemovedByAdmin, false),
      ),
      orderBy: desc(reviewsTable.featuredAt),
      limit,
      with: {
        user: true,
        product: {
          with: {
            translations: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  async getReviewStatusesForOrderItems(orderItemIds: string[]) {
    if (orderItemIds.length === 0) return new Map<string, TReview>();

    const rows = await this.db.client
      .select()
      .from(reviewsTable)
      .where(inArray(reviewsTable.orderItemId, orderItemIds));

    return new Map(rows.map((review) => [review.orderItemId, review]));
  }

  private async listProductReviewsForAdmin(
    params: ReviewListParams = {},
  ): Promise<ReviewPaginatedResult<ReviewWithAdminRelations>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (params.status) conditions.push(eq(reviewsTable.status, params.status));
    if (params.rating) conditions.push(eq(reviewsTable.rating, params.rating));
    if (params.minRating)
      conditions.push(sql`${reviewsTable.rating} >= ${params.minRating}`);
    if (params.maxRating)
      conditions.push(sql`${reviewsTable.rating} <= ${params.maxRating}`);
    if (params.featuredOnly === true)
      conditions.push(eq(reviewsTable.isFeatured, true));
    if (params.removedOnly === true)
      conditions.push(eq(reviewsTable.isRemovedByAdmin, true));
    if (params.reportedOnly === true) {
      conditions.push(
        sql`exists (select 1 from review_reports rr where rr.review_id = ${reviewsTable.id})`,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await this.db.client
      .select({ value: count() })
      .from(reviewsTable)
      .where(where);

    const data: ReviewWithAdminRelations[] =
      await this.db.client.query.reviewsTable.findMany({
        where,
        limit,
        offset,
        orderBy: desc(reviewsTable.createdAt),
        with: {
          user: true,
          product: {
            with: {
              thumbnail: true,
              translations: true,
              shop: {
                with: {
                  translations: true,
                },
              },
            },
          },
          orderItem: {
            with: {
              order: true,
            },
          },
          images: {
            orderBy: asc(reviewImagesTable.displayOrder),
            with: {
              media: true,
            },
          },
          reports: {
            orderBy: desc(reviewReportsTable.createdAt),
            with: {
              reportedBySeller: true,
              resolvedByAdmin: true,
            },
          },
        },
      });

    return {
      data,
      meta: {
        page,
        limit,
        total: totalRow?.value ?? 0,
        pages: Math.ceil((totalRow?.value ?? 0) / limit),
      },
    };
  }
}
