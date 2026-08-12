import { Injectable } from '@nestjs/common';
import type { TInventory } from '@/_db/drizzle/schema';
import type { DrizzleTx } from '@/libs/db/types';
import { toVariantStockProjection } from '@/libs/cart/stock.util';
import { CatalogStockProjectionCommand } from '@/modules/catalog/application/commands/catalog-stock-projection.command';

@Injectable()
export class SyncVariantProjectionService {
  constructor(
    private readonly catalogStockProjection: CatalogStockProjectionCommand,
  ) {}

  async syncFromInventory(
    variantId: string,
    inventory: TInventory,
    tx: DrizzleTx,
  ): Promise<void> {
    const snapshot = toVariantStockProjection(inventory);
    await this.catalogStockProjection.update(variantId, snapshot, tx);
  }
}
