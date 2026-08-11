import type { StockStatus } from './dto/cart-response.dto';
import {
  computeLineTotal as computeLineTotalFromLib,
  computeStockStatus as computeStockStatusFromLib,
} from '@/libs/cart/stock.util';
import { computeCartTotals as computeCartTotalsFromLib } from '@/libs/cart/totals.util';

export type { StockStatus };

export function computeStockStatus(
  inventory: Parameters<typeof computeStockStatusFromLib>[0],
) {
  return computeStockStatusFromLib(inventory);
}

export function computeCartTotals(
  items: Parameters<typeof computeCartTotalsFromLib>[0],
) {
  return computeCartTotalsFromLib(items);
}

export function computeLineTotal(price: string, quantity: number): string {
  return computeLineTotalFromLib(price, quantity);
}
