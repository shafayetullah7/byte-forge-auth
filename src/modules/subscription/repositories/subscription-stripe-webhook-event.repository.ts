import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  subscriptionStripeWebhookEventsTable,
  type TSubscriptionStripeWebhookEvent,
} from '@/_db/drizzle/schema/subscription/subscription-stripe-webhook-events.schema';
import type { DrizzleTx } from '@/libs/db/types';

@Injectable()
export class SubscriptionStripeWebhookEventRepository {
  constructor(private readonly db: DrizzleService) {}

  async tryInsertEvent(
    stripeEventId: string,
    type: string,
    tx: DrizzleTx,
  ): Promise<boolean> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(subscriptionStripeWebhookEventsTable)
      .values({ stripeEventId, type })
      .onConflictDoNothing({
        target: subscriptionStripeWebhookEventsTable.stripeEventId,
      })
      .returning({ id: subscriptionStripeWebhookEventsTable.id })
      .execute();

    return row !== undefined;
  }

  async findByStripeEventId(
    stripeEventId: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionStripeWebhookEvent | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(subscriptionStripeWebhookEventsTable)
      .where(
        eq(subscriptionStripeWebhookEventsTable.stripeEventId, stripeEventId),
      )
      .limit(1)
      .execute();

    return row ?? null;
  }
}
