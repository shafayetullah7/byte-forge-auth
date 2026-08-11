import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { GetStorefrontService } from './services/get-storefront.service';
import { UpdateStorefrontProfileService } from './services/update-storefront-profile.service';
import {
  ReplaceValuePointsService,
  ReplaceWhyChooseUsService,
} from './services/replace-storefront-lists.service';
import { ShopModule } from '@/modules/shop/shop.module';
import { ShopStorefrontRepositoryModule } from '@/_repositories/business/shop-storefront.repository/shop-storefront.repository.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';

@Module({
  controllers: [StorefrontController],
  providers: [
    GetStorefrontService,
    UpdateStorefrontProfileService,
    ReplaceWhyChooseUsService,
    ReplaceValuePointsService,
  ],
  imports: [
    ShopModule,
    ShopStorefrontRepositoryModule,
    VerifiedUserAuthGuardModule,
  ],
})
export class StorefrontModule {}
