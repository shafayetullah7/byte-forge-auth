import type { TInventory } from '@/_db/drizzle/schema';
import { StockStatusEnum } from '@/_db/drizzle/enum/stock-status.enum';
import {
  computeStockStatus,
  toVariantStockProjection,
  UNTRACKED_AVAILABLE_QUANTITY,
} from '../../stock.util';

function inventory(overrides: Partial<TInventory> & Pick<TInventory, 'id'>): TInventory {
  return {
    id: overrides.id,
    variantId: overrides.variantId ?? 'variant-1',
    shopId: overrides.shopId ?? 'shop-1',
    quantity: overrides.quantity ?? 0,
    reservedQuantity: overrides.reservedQuantity ?? 0,
    lowStockThreshold: overrides.lowStockThreshold ?? 5,
    trackInventory: overrides.trackInventory ?? true,
    allowBackorder: overrides.allowBackorder ?? false,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

describe('toVariantStockProjection', () => {
  it('maps in-stock when available exceeds threshold', () => {
    const result = toVariantStockProjection(
      inventory({ id: '1', quantity: 20, reservedQuantity: 0 }),
    );
    expect(result).toEqual({
      availableQuantity: 20,
      stockStatus: StockStatusEnum.IN_STOCK,
    });
  });

  it('maps low stock when available is at threshold', () => {
    const result = toVariantStockProjection(
      inventory({ id: '1', quantity: 5, reservedQuantity: 0, lowStockThreshold: 5 }),
    );
    expect(result).toEqual({
      availableQuantity: 5,
      stockStatus: StockStatusEnum.LOW_STOCK,
    });
  });

  it('maps out of stock when available is zero', () => {
    const result = toVariantStockProjection(
      inventory({ id: '1', quantity: 3, reservedQuantity: 3 }),
    );
    expect(result).toEqual({
      availableQuantity: 0,
      stockStatus: StockStatusEnum.OUT_OF_STOCK,
    });
  });

  it('uses available not total quantity when reserved', () => {
    const result = toVariantStockProjection(
      inventory({ id: '1', quantity: 10, reservedQuantity: 4 }),
    );
    expect(result.availableQuantity).toBe(6);
    expect(result.stockStatus).toBe(StockStatusEnum.IN_STOCK);
  });

  it('treats untracked inventory as always in stock with display cap', () => {
    const result = toVariantStockProjection(
      inventory({ id: '1', quantity: 0, trackInventory: false }),
    );
    expect(result).toEqual({
      availableQuantity: UNTRACKED_AVAILABLE_QUANTITY,
      stockStatus: StockStatusEnum.IN_STOCK,
    });
  });
});

describe('computeStockStatus', () => {
  it('returns null available when tracking is disabled', () => {
    const result = computeStockStatus(
      inventory({ id: '1', trackInventory: false }),
    );
    expect(result.availableQuantity).toBeNull();
    expect(result.maxQuantity).toBe(UNTRACKED_AVAILABLE_QUANTITY);
  });
});
