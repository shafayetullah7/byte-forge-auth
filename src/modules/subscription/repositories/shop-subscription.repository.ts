import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  shopSubscriptionsTable,
  type TNewShopSubscription,
  type TShopSubscription,
} from '@/_db/drizzle/schema/subscription/shop-subscriptions.schema';
import type { DrizzleTx } from '@/libs/db/types';
import type {
  ShopSubscriptionUpdateInput,
  ShopSubscriptionUpsertInput,
} from './shop-subscription.repository.types';

@Injectable()
export class ShopSubscriptionRepository {
  /** Namespace for pg_advisory_xact_lock (subscription shop writers). */
  private static readonly SHOP_LOCK_CLASS_ID = 910_001;

  constructor(private readonly db: DrizzleService) {}

  async acquireShopLock(shopId: string, tx: DrizzleTx): Promise<void> {
    const lockObjectId = this.uuidToHash(shopId);
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(${ShopSubscriptionRepository.SHOP_LOCK_CLASS_ID}, ${lockObjectId})`,
    );
  }

  private uuidToHash(uuid: string): number {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      hash = (hash << 5) - hash + uuid.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  async findByShopId(
    shopId: string,
    tx?: DrizzleTx,
  ): Promise<TShopSubscription | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(shopSubscriptionsTable)
      .where(eq(shopSubscriptionsTable.shopId, shopId))
      .limit(1)
      .execute();

    return row ?? null;
  }

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string,
    tx?: DrizzleTx,
  ): Promise<TShopSubscription | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(shopSubscriptionsTable)
      .where(
        eq(shopSubscriptionsTable.stripeSubscriptionId, stripeSubscriptionId),
      )
      .limit(1)
      .execute();

    return row ?? null;
  }

  async upsertByShopId(
    shopId: string,
    data: ShopSubscriptionUpsertInput,
    tx?: DrizzleTx,
  ): Promise<TShopSubscription> {
    const executor = this.db.getExecutor(tx);
    const values: TNewShopSubscription = {
      shopId,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd,
      billingProvider: data.billingProvider,
      planId: data.planId ?? null,
      stripeCustomerId: data.stripeCustomerId ?? null,
      stripeSubscriptionId: data.stripeSubscriptionId ?? null,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
    };

    const [row] = await executor
      .insert(shopSubscriptionsTable)
      .values(values)
      .onConflictDoUpdate({
        target: shopSubscriptionsTable.shopId,
        set: {
          status: values.status,
          currentPeriodEnd: values.currentPeriodEnd,
          billingProvider: values.billingProvider,
          planId: values.planId,
          stripeCustomerId: values.stripeCustomerId,
          stripeSubscriptionId: values.stripeSubscriptionId,
          cancelAtPeriodEnd: values.cancelAtPeriodEnd,
          updatedAt: new Date(),
        },
      })
      .returning()
      .execute();

    return row;
  }

  async updateByShopId(
    shopId: string,
    data: ShopSubscriptionUpdateInput,
    tx?: DrizzleTx,
  ): Promise<TShopSubscription | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .update(shopSubscriptionsTable)
      .set(data)
      .where(eq(shopSubscriptionsTable.shopId, shopId))
      .returning()
      .execute();

    return row ?? null;
  }
}
