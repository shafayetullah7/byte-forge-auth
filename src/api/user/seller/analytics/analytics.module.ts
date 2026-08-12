import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { ShopModule } from '@/modules/shop/shop.module';
import { ContentModule } from '@/modules/content/content.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import { SellerShopGuardModule } from '@/common/guards/seller-shop-guard/seller-shop.guard.module';

@Module({
  imports: [
    DrizzleModule,
    ShopModule,
    ContentModule,
    VerifiedUserAuthGuardModule,
    SellerShopGuardModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
