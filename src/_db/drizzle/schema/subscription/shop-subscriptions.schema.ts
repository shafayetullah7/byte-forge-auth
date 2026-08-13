import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  SubscriptionBillingProviderEnum,
  SubscriptionStatusEnum,
} from '../../enum';
import { shopTable } from '../shop/shop.schema';
import { subscriptionPlansTable } from './subscription-plans.schema';

export const subscriptionStatusEnum = pgEnum('subscription_status_enum', [
  SubscriptionStatusEnum.NONE,
  SubscriptionStatusEnum.ACTIVE,
  SubscriptionStatusEnum.EXPIRED,
]);

export const subscriptionBillingProviderEnum = pgEnum(
  'subscription_billing_provider_enum',
  [
    SubscriptionBillingProviderEnum.NONE,
    SubscriptionBillingProviderEnum.COUPON,
    SubscriptionBillingProviderEnum.STRIPE,
    SubscriptionBillingProviderEnum.ADMIN,
    SubscriptionBillingProviderEnum.WALLET,
  ],
);

/** One subscription entitlement row per shop. */
export const shopSubscriptionsTable = pgTable(
  'shop_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id')
      .notNull()
      .unique()
      .references(() => shopTable.id, { onDelete: 'cascade' }),
    status: subscriptionStatusEnum('status')
      .default(SubscriptionStatusEnum.NONE)
      .notNull(),
    currentPeriodEnd: timestamp('current_period_end', {
      mode: 'date',
      withTimezone: true,
    }),
    billingProvider: subscriptionBillingProviderEnum('billing_provider')
      .default(SubscriptionBillingProviderEnum.NONE)
      .notNull(),
    planId: uuid('plan_id').references(() => subscriptionPlansTable.id, {
      onDelete: 'set null',
    }),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index('shop_subscriptions_shop_id_idx').on(t.shopId),
    index('shop_subscriptions_status_idx').on(t.status),
    index('shop_subscriptions_period_end_idx').on(t.currentPeriodEnd),
  ],
);

export const shopSubscriptionsRelations = relations(
  shopSubscriptionsTable,
  ({ one }) => ({
    shop: one(shopTable, {
      fields: [shopSubscriptionsTable.shopId],
      references: [shopTable.id],
    }),
    plan: one(subscriptionPlansTable, {
      fields: [shopSubscriptionsTable.planId],
      references: [subscriptionPlansTable.id],
    }),
  }),
);

export type TShopSubscription = typeof shopSubscriptionsTable.$inferSelect;
export type TNewShopSubscription = typeof shopSubscriptionsTable.$inferInsert;
