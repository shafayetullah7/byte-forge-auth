import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { MediaRepositoryModule } from '@/_repositories/providers/media/media.repository/media.repository.module';
import { SellerShopGuardModule } from '@/common/guards/seller-shop-guard/seller-shop.guard.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import {
  ApplyAsSellerCommand,
  UpdateMyShopAddressCommand,
  UpdateMyShopBrandingCommand,
  UpdateMyShopCommand,
  UpsertMyShopContactCommand,
  UpsertMyShopInfoCommand,
} from './application/commands';
import { ShopProfileSectionService } from './application/shop-profile-section.service';
import { GetMyShopQuery, GetShopStatusQuery } from './application/queries';
import { SellerShopProfileController } from './controllers';
import { ShopRepository } from './repositories/shop.repository';

@Module({
  imports: [
    DrizzleModule,
    MediaRepositoryModule,
    VerifiedUserAuthGuardModule,
    SellerShopGuardModule,
  ],
  controllers: [SellerShopProfileController],
  providers: [
    ShopRepository,
    ShopProfileSectionService,
    GetShopStatusQuery,
    GetMyShopQuery,
    ApplyAsSellerCommand,
    UpdateMyShopCommand,
    UpdateMyShopBrandingCommand,
    UpsertMyShopInfoCommand,
    UpsertMyShopContactCommand,
    UpdateMyShopAddressCommand,
  ],
  exports: [
    ShopRepository,
    GetShopStatusQuery,
    GetMyShopQuery,
    ApplyAsSellerCommand,
    UpdateMyShopCommand,
    UpdateMyShopBrandingCommand,
    UpsertMyShopInfoCommand,
    UpsertMyShopContactCommand,
    UpdateMyShopAddressCommand,
  ],
})
export class ShopModule {}
