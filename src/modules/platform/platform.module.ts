import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { ContentModule } from '@/modules/content/content.module';
import { ShopModule } from '@/modules/shop/shop.module';
import {
  CreateLanguageCommand,
  UpdateLanguageCommand,
} from './application/commands';
import {
  GetSellerAnalyticsOverviewQuery,
  ListLanguagesQuery,
} from './application/queries';
import {
  AdminLanguagesController,
  HealthController,
  SellerAnalyticsController,
} from './controllers';
import { LanguageRepository, SellerAnalyticsRepository } from './repositories';

@Module({
  imports: [DrizzleModule, ShopModule, ContentModule],
  controllers: [
    HealthController,
    AdminLanguagesController,
    SellerAnalyticsController,
  ],
  providers: [
    LanguageRepository,
    SellerAnalyticsRepository,
    ListLanguagesQuery,
    CreateLanguageCommand,
    UpdateLanguageCommand,
    GetSellerAnalyticsOverviewQuery,
  ],
})
export class PlatformModule {}
