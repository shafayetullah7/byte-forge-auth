import type {
  TInventory,
  TInventoryMovement,
  TNewInventory,
  TNewInventoryMovement,
} from '@/_db/drizzle/schema/inventory';
import { Inventory } from '../domain/inventory.entity';

export function mapInventoryRowToEntity(row: TInventory): Inventory {
  return new Inventory({
    id: row.id,
    variantId: row.variantId,
    shopId: row.shopId,
    quantity: row.quantity,
    reservedQuantity: row.reservedQuantity,
    lowStockThreshold: row.lowStockThreshold,
    trackInventory: row.trackInventory,
    allowBackorder: row.allowBackorder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function mapInventoryEntityToUpdatePatch(
  inventory: Inventory,
): Partial<Pick<TNewInventory, 'quantity' | 'reservedQuantity'>> {
  return {
    quantity: inventory.quantity,
    reservedQuantity: inventory.reservedQuantity,
  };
}

export type {
  TInventory,
  TNewInventory,
  TInventoryMovement,
  TNewInventoryMovement,
};
