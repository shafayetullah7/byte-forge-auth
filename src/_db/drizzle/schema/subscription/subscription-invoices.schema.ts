import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  decimal,
  json,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  SubscriptionBillingProviderEnum,
  SubscriptionInvoiceStatusEnum,
} from '../../enum';
import { shopTable } from '../shop/shop.schema';
import { subscriptionPlansTable } from './subscription-plans.schema';

export const subscriptionInvoiceStatusEnum = pgEnum(
  'subscription_invoice_status_enum',
  [
    SubscriptionInvoiceStatusEnum.PENDING,
    SubscriptionInvoiceStatusEnum.PAID,
    SubscriptionInvoiceStatusEnum.FAILED,
    SubscriptionInvoiceStatusEnum.VOID,
  ],
);

export const subscriptionInvoiceProviderEnum = pgEnum(
  'subscription_invoice_provider_enum',
  [
    SubscriptionBillingProviderEnum.COUPON,
    SubscriptionBillingProviderEnum.STRIPE,
    SubscriptionBillingProviderEnum.ADMIN,
    SubscriptionBillingProviderEnum.WALLET,
  ],
);

/** Payment records for seller subscription (not buyer order payments). */
export const subscriptionInvoicesTable = pgTable(
  'subscription_invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shopTable.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id').references(() => subscriptionPlansTable.id, {
      onDelete: 'set null',
    }),
    amountBdt: decimal('amount_bdt', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('BDT'),
    provider: subscriptionInvoiceProviderEnum('provider').notNull(),
    status: subscriptionInvoiceStatusEnum('status')
      .default(SubscriptionInvoiceStatusEnum.PENDING)
      .notNull(),
    externalId: varchar('external_id', { length: 255 }),
    receiptUrl: varchar('receipt_url', { length: 2048 }),
    periodStart: timestamp('period_start', {
      mode: 'date',
      withTimezone: true,
    }),
    periodEnd: timestamp('period_end', { mode: 'date', withTimezone: true }),
    paidAt: timestamp('paid_at', { mode: 'date', withTimezone: true }),
    metadata: json('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index('subscription_invoices_shop_id_idx').on(t.shopId),
    index('subscription_invoices_status_idx').on(t.status),
    index('subscription_invoices_external_id_idx').on(t.externalId),
    uniqueIndex('subscription_invoices_provider_external_uidx').on(
      t.provider,
      t.externalId,
    ),
  ],
);

export const subscriptionInvoicesRelations = relations(
  subscriptionInvoicesTable,
  ({ one }) => ({
    shop: one(shopTable, {
      fields: [subscriptionInvoicesTable.shopId],
      references: [shopTable.id],
    }),
    plan: one(subscriptionPlansTable, {
      fields: [subscriptionInvoicesTable.planId],
      references: [subscriptionPlansTable.id],
    }),
  }),
);

export type TSubscriptionInvoice = typeof subscriptionInvoicesTable.$inferSelect;
export type TNewSubscriptionInvoice =
  typeof subscriptionInvoicesTable.$inferInsert;
