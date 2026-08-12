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

export function mapInventoryEntityToRow(inventory: Inventory): TInventory {
  return {
    id: inventory.id,
    variantId: inventory.variantId,
    shopId: inventory.shopId,
    quantity: inventory.quantity,
    reservedQuantity: inventory.reservedQuantity,
    lowStockThreshold: inventory.lowStockThreshold,
    trackInventory: inventory.trackInventory,
    allowBackorder: inventory.allowBackorder,
    createdAt: inventory.createdAt,
    updatedAt: inventory.updatedAt,
  };
}

export type {
  TInventory,
  TNewInventory,
  TInventoryMovement,
  TNewInventoryMovement,
};
