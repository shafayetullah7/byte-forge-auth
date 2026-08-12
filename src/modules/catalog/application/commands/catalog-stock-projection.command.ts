import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { productVariantsTable } from '@/_db/drizzle/schema';
import type { TStockStatus } from '@/_db/drizzle/enum/stock-status.enum';
import type { DrizzleTx } from '@/libs/db/types';

export type VariantStockProjection = {
  availableQuantity: number;
  stockStatus: TStockStatus;
};

/**
 * Updates denormalized stock fields on product_variants.
 * Called by the inventory module after every stock mutation (same transaction).
 */
@Injectable()
export class CatalogStockProjectionCommand {
  constructor(private readonly db: DrizzleService) {}

  async update(
    variantId: string,
    snapshot: VariantStockProjection,
    tx: DrizzleTx,
  ): Promise<void> {
    const executor = this.db.getExecutor(tx);
    await executor
      .update(productVariantsTable)
      .set({
        availableQuantity: snapshot.availableQuantity,
        stockStatus: snapshot.stockStatus,
        updatedAt: new Date(),
      })
      .where(eq(productVariantsTable.id, variantId))
      .execute();
  }
}
