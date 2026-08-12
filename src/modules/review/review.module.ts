import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { ShopModule } from '@/modules/shop/shop.module';
import {
  CreateBuyerReviewCommand,
  ReportSellerReviewCommand,
} from './application/commands';
import {
  GetBuyerReviewEligibilityQuery,
  GetPublicShopReviewsQuery,
  ListBuyerReviewsQuery,
  ListSellerProductReviewsQuery,
  ReviewQueryService,
} from './application/queries';
import {
  BuyerReviewsController,
  PublicShopReviewsController,
  SellerReviewsController,
} from './controllers';
import { ReviewRepository } from './repositories/review.repository';

@Module({
  imports: [DrizzleModule, ShopModule],
  controllers: [
    BuyerReviewsController,
    SellerReviewsController,
    PublicShopReviewsController,
  ],
  providers: [
    ReviewRepository,
    ReviewQueryService,
    GetBuyerReviewEligibilityQuery,
    ListBuyerReviewsQuery,
    ListSellerProductReviewsQuery,
    GetPublicShopReviewsQuery,
    CreateBuyerReviewCommand,
    ReportSellerReviewCommand,
  ],
  exports: [ReviewQueryService, ReviewRepository],
})
export class ReviewModule {}
