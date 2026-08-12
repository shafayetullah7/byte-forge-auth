import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { SellerApiModule } from './seller/seller-api.module';
import { BuyerApiModule } from './buyer/buyer.module';

@Module({
  imports: [UserModule, SellerApiModule, BuyerApiModule],
  exports: [UserModule, SellerApiModule, BuyerApiModule],
})
export class UserApiModule {}
