import type { TInventory } from '@/_db/drizzle/schema';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function computeStockStatus(inventory: TInventory | null | undefined): {
  stockStatus: StockStatus;
  availableQuantity: number | null;
  maxQuantity: number;
} {
  if (!inventory || !inventory.trackInventory) {
    return {
      stockStatus: 'in_stock',
      availableQuantity: null,
      maxQuantity: 999,
    };
  }
  const available = inventory.quantity - inventory.reservedQuantity;
  const stockStatus: StockStatus =
    available <= 0
      ? 'out_of_stock'
      : available <= inventory.lowStockThreshold
        ? 'low_stock'
        : 'in_stock';
  return {
    stockStatus,
    availableQuantity: available,
    maxQuantity: Math.max(0, available),
  };
}

export function computeLineTotal(price: string, quantity: number): string {
  return (parseFloat(price) * quantity).toFixed(2);
}
