import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  decimal,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { productsTable } from './products.schema';
import { plantVariantAttributesTable } from './plant-variant-attributes.schema';
import { productMediaTable } from './product-media.schema';
import { productVariantTranslationsTable } from './product-variant-translations.schema';
import { StockStatusEnum } from '../../enum/stock-status.enum';

export const variantStockStatusEnum = pgEnum('variant_stock_status_enum', [
  StockStatusEnum.IN_STOCK,
  StockStatusEnum.LOW_STOCK,
  StockStatusEnum.OUT_OF_STOCK,
]);

/**
 * Product Variants Table
 *
 * EVERY product must have at least ONE variant.
 * Cart and Orders reference this table ONLY.
 *
 * The base/default variant is marked with isBase = true
 *
 * Stock display/filter fields (availableQuantity, stockStatus) are a read
 * projection synced from the inventory table by the inventory module.
 *
 * Type-specific attributes are stored in:
 * - plant_variant_attributes
 * - pot_variant_attributes
 * - seed_variant_attributes
 * - fertilizer_variant_attributes
 */
export const productVariantsTable = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 100 }).unique(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    availableQuantity: integer('available_quantity').default(0).notNull(),
    stockStatus: variantStockStatusEnum('stock_status')
      .default(StockStatusEnum.OUT_OF_STOCK)
      .notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    isBase: boolean('is_base').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index('product_variants_product_id_idx').on(t.productId),
    index('product_variants_sku_idx').on(t.sku),
    index('product_variants_price_idx').on(t.price),
    index('product_variants_available_quantity_idx').on(t.availableQuantity),
    index('product_variants_stock_status_idx').on(t.stockStatus),
    index('product_variants_is_active_idx').on(t.isActive),
    index('product_variants_display_order_idx').on(t.displayOrder),
    index('product_variants_is_base_idx').on(t.isBase),
  ],
);

export type TProductVariant = typeof productVariantsTable.$inferSelect;
export type TNewProductVariant = typeof productVariantsTable.$inferInsert;

export const productVariantsRelations = relations(
  productVariantsTable,
  ({ one, many }) => ({
    product: one(productsTable, {
      fields: [productVariantsTable.productId],
      references: [productsTable.id],
    }),
    plantAttributes: one(plantVariantAttributesTable, {
      fields: [productVariantsTable.id],
      references: [plantVariantAttributesTable.variantId],
    }),
    media: many(productMediaTable),
    translations: many(productVariantTranslationsTable),
  }),
);
