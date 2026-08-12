import { Module } from '@nestjs/common';
import { SellerApiModule } from './seller/seller-api.module';

@Module({
  imports: [SellerApiModule],
  exports: [SellerApiModule],
})
export class UserApiModule {}
