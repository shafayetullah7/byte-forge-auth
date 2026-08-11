import { Module } from '@nestjs/common';

import { InventoryModule } from './inventory/inventory.module';
import { SellerReviewsModule } from './reviews/seller-reviews.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ArticlesModule } from './articles/articles.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    InventoryModule,
    SellerReviewsModule,
    CampaignsModule,
    ArticlesModule,
    AnalyticsModule,
  ],
})
export class SellerApiModule {}
