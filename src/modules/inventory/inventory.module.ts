import { Module, forwardRef } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { ShopModule } from '@/modules/shop/shop.module';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { InventoryCommandService } from './application/commands/inventory.command';
import { SellerInventoryService } from './application/seller-inventory.service';
import { AdjustStockService } from './application/services/adjust-stock.service';
import { GetProductInventoryService } from './application/services/get-product-inventory.service';
import { GetStockMovementsService } from './application/services/get-stock-movements.service';
import { MarkDamagedService } from './application/services/mark-damaged.service';
import { RestockVariantService } from './application/services/restock-variant.service';
import { SyncVariantProjectionService } from './application/services/sync-variant-projection.service';
import { SellerInventoryController } from './controllers/seller-inventory.controller';
import { InventoryRepository } from './repositories/inventory.repository';

@Module({
  imports: [DrizzleModule, ShopModule, forwardRef(() => CatalogModule)],
  controllers: [SellerInventoryController],
  providers: [
    InventoryRepository,
    InventoryCommandService,
    SellerInventoryService,
    GetProductInventoryService,
    GetStockMovementsService,
    RestockVariantService,
    AdjustStockService,
    MarkDamagedService,
    SyncVariantProjectionService,
  ],
  exports: [InventoryCommandService, InventoryRepository, SyncVariantProjectionService],
})
export class InventoryModule {}
