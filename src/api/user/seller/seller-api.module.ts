import { Module } from '@nestjs/common';

import { ShopModule } from './shop/shop.module';
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
    ShopModule,
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
  exports: [ShopModule],
})
export class SellerApiModule {}
