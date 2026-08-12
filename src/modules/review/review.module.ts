import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { ShopModule } from '@/modules/shop/shop.module';
import {
  CreateBuyerReviewCommand,
  FeatureReviewCommand,
  RemoveReviewCommand,
  ReportSellerReviewCommand,
  RestoreReviewCommand,
  UnfeatureReviewCommand,
  UpdateReviewReportStatusCommand,
} from './application/commands';
import {
  GetAdminReviewQuery,
  GetBuyerReviewEligibilityQuery,
  GetPublicPlantReviewsQuery,
  GetPublicProductReviewsQuery,
  GetPublicShopReviewsQuery,
  ListAdminReviewsQuery,
  ListBuyerReviewsQuery,
  ListFeaturedPublicReviewsQuery,
  ListSellerProductReviewsQuery,
  ReviewQueryService,
} from './application/queries';
import {
  AdminReviewsController,
  BuyerReviewsController,
  PublicReviewsController,
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
    PublicReviewsController,
    AdminReviewsController,
  ],
  providers: [
    ReviewRepository,
    ReviewQueryService,
    GetBuyerReviewEligibilityQuery,
    ListBuyerReviewsQuery,
    ListSellerProductReviewsQuery,
    GetPublicShopReviewsQuery,
    GetPublicProductReviewsQuery,
    GetPublicPlantReviewsQuery,
    ListFeaturedPublicReviewsQuery,
    ListAdminReviewsQuery,
    GetAdminReviewQuery,
    CreateBuyerReviewCommand,
    ReportSellerReviewCommand,
    FeatureReviewCommand,
    UnfeatureReviewCommand,
    RemoveReviewCommand,
    RestoreReviewCommand,
    UpdateReviewReportStatusCommand,
  ],
  exports: [ReviewQueryService],
})
export class ReviewModule {}
