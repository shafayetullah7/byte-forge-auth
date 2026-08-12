import {
  StockStatusEnum,
  type TStockStatus,
} from '@/_db/drizzle/enum/stock-status.enum';

/** Whether a variant is purchasable based on catalog read projection. */
export function isVariantInStock(
  availableQuantity: number | null | undefined,
  stockStatus?: TStockStatus | string | null,
): boolean {
  if (stockStatus) {
    return stockStatus !== StockStatusEnum.OUT_OF_STOCK;
  }
  return (availableQuantity ?? 0) > 0;
}

/**
 * Maps variant projection columns to API stock fields.
 * `inventoryCount` in responses = available quantity (not total on hand).
 */
export function mapVariantStockToApi(
  availableQuantity: number | null | undefined,
  stockStatus?: TStockStatus | string | null,
): { inventoryCount: number; inStock: boolean } {
  const qty = availableQuantity ?? 0;
  const status = stockStatus as TStockStatus | null | undefined;
  return {
    inventoryCount: qty,
    inStock: isVariantInStock(qty, status),
  };
}

export function isVariantLowStock(
  stockStatus?: TStockStatus | string | null,
): boolean {
  return stockStatus === StockStatusEnum.LOW_STOCK;
}
