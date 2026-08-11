import { Module } from '@nestjs/common';

import { PlantsModule } from './plants/plants.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShippingRatesModule } from './shipping-rates/shipping-rates.module';
import { StorefrontModule } from './storefront/storefront.module';
import { SellerReviewsModule } from './reviews/seller-reviews.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ArticlesModule } from './articles/articles.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    PlantsModule,
    ProductsModule,
    InventoryModule,
    ShippingRatesModule,
    StorefrontModule,
    SellerReviewsModule,
    CampaignsModule,
    ArticlesModule,
    AnalyticsModule,
  ],
})
export class SellerApiModule {}
