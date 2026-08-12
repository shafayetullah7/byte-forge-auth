import type { TInventory } from '@/_db/drizzle/schema';
import { StockStatusEnum, type TStockStatus } from '@/_db/drizzle/enum/stock-status.enum';

export type StockStatus = TStockStatus;

/** Matches cart max when inventory tracking is disabled. */
export const UNTRACKED_AVAILABLE_QUANTITY = 999;

export function computeStockStatus(inventory: TInventory | null | undefined): {
  stockStatus: StockStatus;
  availableQuantity: number | null;
  maxQuantity: number;
} {
  if (!inventory || !inventory.trackInventory) {
    return {
      stockStatus: StockStatusEnum.IN_STOCK,
      availableQuantity: null,
      maxQuantity: UNTRACKED_AVAILABLE_QUANTITY,
    };
  }
  const available = inventory.quantity - inventory.reservedQuantity;
  const stockStatus: StockStatus =
    available <= 0
      ? StockStatusEnum.OUT_OF_STOCK
      : available <= inventory.lowStockThreshold
        ? StockStatusEnum.LOW_STOCK
        : StockStatusEnum.IN_STOCK;
  return {
    stockStatus,
    availableQuantity: available,
    maxQuantity: Math.max(0, available),
  };
}

/** Maps inventory truth to variant read projection columns. */
export function toVariantStockProjection(inventory: TInventory): {
  availableQuantity: number;
  stockStatus: StockStatus;
} {
  if (!inventory.trackInventory) {
    return {
      availableQuantity: UNTRACKED_AVAILABLE_QUANTITY,
      stockStatus: StockStatusEnum.IN_STOCK,
    };
  }
  const { stockStatus, availableQuantity } = computeStockStatus(inventory);
  return {
    availableQuantity: Math.max(0, availableQuantity ?? 0),
    stockStatus,
  };
}

export function computeLineTotal(price: string, quantity: number): string {
  return (parseFloat(price) * quantity).toFixed(2);
}
