import { Module } from '@nestjs/common';
import { AdminShopController } from './admin-shop.controller';
import { AdminShopService } from './admin-shop.service';
import { ShopModule } from '@/modules/shop/shop.module';
import { ShopVerificationRepositoryModule } from '@/_repositories/business/shop.verification.repository/shop.verification.repository.module';
import { ShopVerificationHistoryModule } from '@/_repositories/business/shop.verification.history.repository/shop.verification.history.repository.module';
import { AdminAuthGuardModule } from '@/common/guards/admin-auth-guard/admin-auth-guard.module';

@Module({
  controllers: [AdminShopController],
  providers: [AdminShopService],
  imports: [
    ShopModule,
    ShopVerificationRepositoryModule,
    ShopVerificationHistoryModule,
    AdminAuthGuardModule,
  ],
  exports: [AdminShopService],
})
export class AdminShopModule {}
