import { Module } from '@nestjs/common';
import { AddressesModule } from './addresses/addresses.module';
import { BuyerReviewsModule } from './reviews/buyer-reviews.module';

@Module({
  imports: [AddressesModule, BuyerReviewsModule],
  exports: [AddressesModule, BuyerReviewsModule],
})
export class BuyerApiModule {}
