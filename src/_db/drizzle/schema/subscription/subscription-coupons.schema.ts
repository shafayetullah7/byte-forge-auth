import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { SubscriptionDurationUnitEnum } from '../../enum';
import { shopTable } from '../shop/shop.schema';

export const subscriptionDurationUnitEnum = pgEnum(
  'subscription_duration_unit_enum',
  [SubscriptionDurationUnitEnum.DAY, SubscriptionDurationUnitEnum.MONTH],
);

/** Seller subscription coupons (separate from buyer checkout coupons). */
export const subscriptionCouponsTable = pgTable(
  'subscription_coupons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 64 }).notNull().unique(),
    durationValue: integer('duration_value').notNull(),
    durationUnit: subscriptionDurationUnitEnum('duration_unit').notNull(),
    maxRedemptions: integer('max_redemptions'),
    redemptionCount: integer('redemption_count').default(0).notNull(),
    validFrom: timestamp('valid_from', { mode: 'date', withTimezone: true }),
    validUntil: timestamp('valid_until', { mode: 'date', withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index('subscription_coupons_code_idx').on(t.code)],
);

export type TSubscriptionCoupon = typeof subscriptionCouponsTable.$inferSelect;
export type TNewSubscriptionCoupon =
  typeof subscriptionCouponsTable.$inferInsert;

export const subscriptionCouponRedemptionsTable = pgTable(
  'subscription_coupon_redemptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => subscriptionCouponsTable.id, { onDelete: 'cascade' }),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shopTable.id, { onDelete: 'cascade' }),
    redeemedAt: timestamp('redeemed_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    periodEndAfter: timestamp('period_end_after', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
  },
  (t) => [
    index('subscription_coupon_redemptions_shop_id_idx').on(t.shopId),
    index('subscription_coupon_redemptions_coupon_id_idx').on(t.couponId),
    uniqueIndex('subscription_coupon_redemptions_shop_coupon_uidx').on(
      t.shopId,
      t.couponId,
    ),
  ],
);

export const subscriptionCouponsRelations = relations(
  subscriptionCouponsTable,
  ({ many }) => ({
    redemptions: many(subscriptionCouponRedemptionsTable),
  }),
);

export const subscriptionCouponRedemptionsRelations = relations(
  subscriptionCouponRedemptionsTable,
  ({ one }) => ({
    coupon: one(subscriptionCouponsTable, {
      fields: [subscriptionCouponRedemptionsTable.couponId],
      references: [subscriptionCouponsTable.id],
    }),
    shop: one(shopTable, {
      fields: [subscriptionCouponRedemptionsTable.shopId],
      references: [shopTable.id],
    }),
  }),
);

export type TSubscriptionCouponRedemption =
  typeof subscriptionCouponRedemptionsTable.$inferSelect;
export type TNewSubscriptionCouponRedemption =
  typeof subscriptionCouponRedemptionsTable.$inferInsert;
