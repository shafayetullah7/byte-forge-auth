import type { StockStatus } from './dto/cart-response.dto';
import {
  computeLineTotal as computeLineTotalFromLib,
  computeStockStatus as computeStockStatusFromLib,
} from '@/libs/cart/stock.util';

export type { StockStatus };

export function computeStockStatus(
  inventory: Parameters<typeof computeStockStatusFromLib>[0],
) {
  return computeStockStatusFromLib(inventory);
}

export function computeCartTotals(
  items: { price: string; quantity: number }[],
): { totalQuantity: number; subtotal: string } {
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + parseFloat(i.price) * i.quantity,
    0,
  );
  return {
    totalQuantity,
    subtotal: subtotal.toFixed(2),
  };
}

export function computeLineTotal(price: string, quantity: number): string {
  return computeLineTotalFromLib(price, quantity);
}
