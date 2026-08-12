import {
  date,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { shopTable } from '../shop/shop.schema';

/** Per-shop daily Plant AI usage for rate limiting and ops metrics (UTC date). */
export const plantAiUsageTable = pgTable(
  'plant_ai_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shopTable.id, { onDelete: 'cascade' }),
    /** UTC calendar date (YYYY-MM-DD). */
    usageDate: date('usage_date').notNull(),
    requestCount: integer('request_count').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique('plant_ai_usage_shop_date_unique').on(t.shopId, t.usageDate),
    index('plant_ai_usage_usage_date_idx').on(t.usageDate),
  ],
);

export type TPlantAiUsage = typeof plantAiUsageTable.$inferSelect;
export type TNewPlantAiUsage = typeof plantAiUsageTable.$inferInsert;

export const plantAiUsageRelations = relations(plantAiUsageTable, ({ one }) => ({
  shop: one(shopTable, {
    fields: [plantAiUsageTable.shopId],
    references: [shopTable.id],
  }),
}));
