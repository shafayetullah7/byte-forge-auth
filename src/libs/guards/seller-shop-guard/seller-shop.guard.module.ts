import { Global, Module } from '@nestjs/common';
import { SellerShopGuard } from './seller-shop.guard';

@Global()
@Module({
  providers: [SellerShopGuard],
  exports: [SellerShopGuard],
})
export class SellerShopGuardModule {}
