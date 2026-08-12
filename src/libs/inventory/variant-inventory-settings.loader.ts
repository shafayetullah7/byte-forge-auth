import { inArray } from 'drizzle-orm';
import type { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { inventoryTable } from '@/_db/drizzle/schema';

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;
export const DEFAULT_TRACK_INVENTORY = true;

export type VariantInventorySettings = {
  trackInventory: boolean;
  lowStockThreshold: number;
};

export async function loadVariantInventorySettings(
  db: DrizzleService,
  variantIds: string[],
): Promise<Map<string, VariantInventorySettings>> {
  if (variantIds.length === 0) {
    return new Map();
  }

  const rows = await db.client
    .select({
      variantId: inventoryTable.variantId,
      trackInventory: inventoryTable.trackInventory,
      lowStockThreshold: inventoryTable.lowStockThreshold,
    })
    .from(inventoryTable)
    .where(inArray(inventoryTable.variantId, variantIds))
    .execute();

  return new Map(
    rows.map((row) => [
      row.variantId,
      {
        trackInventory: row.trackInventory,
        lowStockThreshold: row.lowStockThreshold,
      },
    ]),
  );
}

export function resolveVariantInventorySettings(
  settingsByVariantId: Map<string, VariantInventorySettings>,
  variantId: string,
): VariantInventorySettings {
  return (
    settingsByVariantId.get(variantId) ?? {
      trackInventory: DEFAULT_TRACK_INVENTORY,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    }
  );
}
