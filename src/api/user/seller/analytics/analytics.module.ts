import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { ShopModule } from '@/modules/shop/shop.module';
import { ShopCampaignRepositoryModule } from '@/_repositories/business/shop-campaign.repository/shop-campaign.repository.module';
import { ShopArticleRepositoryModule } from '@/_repositories/business/shop-article.repository/shop-article.repository.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import { SellerShopGuardModule } from '@/common/guards/seller-shop-guard/seller-shop.guard.module';

@Module({
  imports: [
    DrizzleModule,
    ShopModule,
    ShopCampaignRepositoryModule,
    ShopArticleRepositoryModule,
    VerifiedUserAuthGuardModule,
    SellerShopGuardModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
