import { Module } from '@nestjs/common';
import { AddressesModule } from './addresses/addresses.module';
import { BuyerReviewsModule } from './reviews/buyer-reviews.module';
import { ShopFollowModule } from './shop-follow/shop-follow.module';

@Module({
  imports: [AddressesModule, BuyerReviewsModule, ShopFollowModule],
  exports: [AddressesModule, BuyerReviewsModule, ShopFollowModule],
})
export class BuyerApiModule {}
