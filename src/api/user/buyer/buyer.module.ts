import { Module } from '@nestjs/common';
import { CartModule } from './cart/cart.module';
import { AddressesModule } from './addresses/addresses.module';
import { BuyerReviewsModule } from './reviews/buyer-reviews.module';
import { ShopFollowModule } from './shop-follow/shop-follow.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    CartModule,
    AddressesModule,
    BuyerReviewsModule,
    ShopFollowModule,
    WishlistModule,
  ],
  exports: [
    CartModule,
    AddressesModule,
    BuyerReviewsModule,
    ShopFollowModule,
    WishlistModule,
  ],
})
export class BuyerApiModule {}
