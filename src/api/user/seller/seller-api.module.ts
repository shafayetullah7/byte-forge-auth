import { Module } from '@nestjs/common';

import { InventoryModule } from './inventory/inventory.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [InventoryModule, CampaignsModule, AnalyticsModule],
})
export class SellerApiModule {}
