import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/** Idempotency log for Stripe subscription webhooks. */
export const subscriptionStripeWebhookEventsTable = pgTable(
  'subscription_stripe_webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    stripeEventId: varchar('stripe_event_id', { length: 255 }).notNull(),
    type: varchar('type', { length: 128 }).notNull(),
    processedAt: timestamp('processed_at', {
      mode: 'date',
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('subscription_stripe_webhook_events_event_id_uidx').on(
      t.stripeEventId,
    ),
  ],
);

export type TSubscriptionStripeWebhookEvent =
  typeof subscriptionStripeWebhookEventsTable.$inferSelect;
export type TNewSubscriptionStripeWebhookEvent =
  typeof subscriptionStripeWebhookEventsTable.$inferInsert;
