import { eq, sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { DrizzleTx } from '@/libs/db/types';
import {
  shopShippingRatesTable,
  type TNewShopShippingRate,
  type TShopShippingRate,
} from '@/_db/drizzle/schema';

@Injectable()
export class ShopShippingRatesRepository {
  constructor(private readonly db: DrizzleService) {}

  async upsertBulk(
    shopId: string,
    rates: { districtId: string; cost: string; costPerKg?: string }[],
    tx?: DrizzleTx,
  ): Promise<TShopShippingRate[]> {
    const executor = this.db.getExecutor(tx);

    const values: TNewShopShippingRate[] = rates.map((r) => ({
      shopId,
      districtId: r.districtId,
      cost: r.cost,
      costPerKg: r.costPerKg ?? '0',
    }));

    if (values.length === 0) return [];

    return await executor
      .insert(shopShippingRatesTable)
      .values(values)
      .onConflictDoUpdate({
        target: [
          shopShippingRatesTable.shopId,
          shopShippingRatesTable.districtId,
        ],
        set: {
          cost: sql`EXCLUDED.cost`,
          costPerKg: sql`EXCLUDED.cost_per_kg`,
        },
      })
      .returning();
  }

  async deleteByShop(shopId: string, tx?: DrizzleTx): Promise<void> {
    const executor = this.db.getExecutor(tx);
    await executor
      .delete(shopShippingRatesTable)
      .where(eq(shopShippingRatesTable.shopId, shopId))
      .execute();
  }
}
