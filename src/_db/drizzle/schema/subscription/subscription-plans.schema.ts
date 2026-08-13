import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  boolean,
  integer,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { SubscriptionIntervalEnum } from '../../enum';

export const subscriptionIntervalEnum = pgEnum('subscription_interval_enum', [
  SubscriptionIntervalEnum.MONTH,
  SubscriptionIntervalEnum.YEAR,
]);

/** Admin-managed seller subscription plans (platform billing, not buyer checkout). */
export const subscriptionPlansTable = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  interval: subscriptionIntervalEnum('interval').notNull(),
  priceBdt: decimal('price_bdt', { precision: 12, scale: 2 }).notNull(),
  isActiveForNew: boolean('is_active_for_new').default(true).notNull(),
  isRetired: boolean('is_retired').default(false).notNull(),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  /** Prior Stripe Price IDs kept for grandfathered subscribers. */
  previousStripePriceIds: json('previous_stripe_price_ids')
    .$type<string[]>()
    .default([]),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type TSubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;
export type TNewSubscriptionPlan = typeof subscriptionPlansTable.$inferInsert;
