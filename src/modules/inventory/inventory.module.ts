import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { InventoryCommandService } from './application/commands/inventory.command';
import { InventoryRepository } from './repositories/inventory.repository';

/**
 * Inventory domain module. Seller HTTP endpoints migrate here in a later phase.
 * Legacy seller inventory API and `_repositories/business/inventory.repository` remain until cutover.
 */
@Module({
  imports: [DrizzleModule],
  controllers: [],
  providers: [InventoryRepository, InventoryCommandService],
  exports: [InventoryCommandService],
})
export class InventoryModule {}
