import { Module } from '@nestjs/common';

import { InventoryModule } from './inventory/inventory.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [InventoryModule, AnalyticsModule],
})
export class SellerApiModule {}
