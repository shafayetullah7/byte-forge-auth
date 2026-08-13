import { Injectable } from '@nestjs/common';
import { SQL, and, asc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  subscriptionCouponRedemptionsTable,
  subscriptionCouponsTable,
  type TNewSubscriptionCoupon,
  type TNewSubscriptionCouponRedemption,
  type TSubscriptionCoupon,
  type TSubscriptionCouponRedemption,
} from '@/_db/drizzle/schema/subscription/subscription-coupons.schema';
import type { DrizzleTx } from '@/libs/db/types';
import type {
  SubscriptionCouponFilters,
  SubscriptionCouponUpdateInput,
} from './subscription-coupon.repository.types';

@Injectable()
export class SubscriptionCouponRepository {
  constructor(private readonly db: DrizzleService) {}

  private buildWhere(filters?: SubscriptionCouponFilters): SQL[] {
    if (!filters) return [];

    const where: SQL[] = [];

    if (filters.isActive !== undefined) {
      where.push(eq(subscriptionCouponsTable.isActive, filters.isActive));
    }

    if (filters.search?.trim()) {
      where.push(
        ilike(subscriptionCouponsTable.code, `%${filters.search.trim()}%`),
      );
    }

    return where;
  }

  async findAll(
    filters?: SubscriptionCouponFilters,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionCoupon[]> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(filters);

    return executor
      .select()
      .from(subscriptionCouponsTable)
      .where(where.length ? and(...where) : undefined)
      .orderBy(asc(subscriptionCouponsTable.createdAt))
      .execute();
  }

  async findById(
    id: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionCoupon | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(subscriptionCouponsTable)
      .where(eq(subscriptionCouponsTable.id, id))
      .limit(1)
      .execute();

    return row ?? null;
  }

  async findByCode(
    code: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionCoupon | null> {
    const executor = this.db.getExecutor(tx);
    const normalized = code.trim().toUpperCase();
    const [row] = await executor
      .select()
      .from(subscriptionCouponsTable)
      .where(eq(subscriptionCouponsTable.code, normalized))
      .limit(1)
      .execute();

    return row ?? null;
  }

  async findByCodeForUpdate(
    code: string,
    tx: DrizzleTx,
  ): Promise<TSubscriptionCoupon | null> {
    const executor = this.db.getExecutor(tx);
    const normalized = code.trim().toUpperCase();
    const [row] = await executor
      .select()
      .from(subscriptionCouponsTable)
      .where(eq(subscriptionCouponsTable.code, normalized))
      .limit(1)
      .for('update')
      .execute();

    return row ?? null;
  }

  async tryIncrementRedemptionCount(
    id: string,
    tx: DrizzleTx,
  ): Promise<boolean> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .update(subscriptionCouponsTable)
      .set({
        redemptionCount: sql`${subscriptionCouponsTable.redemptionCount} + 1`,
      })
      .where(
        and(
          eq(subscriptionCouponsTable.id, id),
          or(
            isNull(subscriptionCouponsTable.maxRedemptions),
            sql`${subscriptionCouponsTable.redemptionCount} < ${subscriptionCouponsTable.maxRedemptions}`,
          ),
        ),
      )
      .returning({ id: subscriptionCouponsTable.id })
      .execute();

    return row !== undefined;
  }

  async create(
    data: TNewSubscriptionCoupon,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionCoupon> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(subscriptionCouponsTable)
      .values({
        ...data,
        code: data.code.trim().toUpperCase(),
      })
      .returning()
      .execute();

    return row;
  }

  async update(
    id: string,
    data: SubscriptionCouponUpdateInput,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionCoupon | null> {
    const executor = this.db.getExecutor(tx);
    const patch = {
      ...data,
      ...(data.code ? { code: data.code.trim().toUpperCase() } : {}),
    };

    const [row] = await executor
      .update(subscriptionCouponsTable)
      .set(patch)
      .where(eq(subscriptionCouponsTable.id, id))
      .returning()
      .execute();

    return row ?? null;
  }

  async deactivate(
    id: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionCoupon | null> {
    return this.update(id, { isActive: false }, tx);
  }

  async incrementRedemptionCount(
    id: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionCoupon | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .update(subscriptionCouponsTable)
      .set({
        redemptionCount: sql`${subscriptionCouponsTable.redemptionCount} + 1`,
      })
      .where(eq(subscriptionCouponsTable.id, id))
      .returning()
      .execute();

    return row ?? null;
  }

  async createRedemption(
    data: TNewSubscriptionCouponRedemption,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionCouponRedemption> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(subscriptionCouponRedemptionsTable)
      .values(data)
      .returning()
      .execute();

    return row;
  }

  async findRedemptionByShopAndCoupon(
    shopId: string,
    couponId: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionCouponRedemption | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(subscriptionCouponRedemptionsTable)
      .where(
        and(
          eq(subscriptionCouponRedemptionsTable.shopId, shopId),
          eq(subscriptionCouponRedemptionsTable.couponId, couponId),
        ),
      )
      .limit(1)
      .execute();

    return row ?? null;
  }
}
