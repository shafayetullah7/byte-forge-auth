/**
 * Variant stock status (catalog read projection).
 * Aligns with libs/cart/stock.util.ts StockStatus.
 */
export const StockStatusEnum = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

export type TStockStatus =
  (typeof StockStatusEnum)[keyof typeof StockStatusEnum];
