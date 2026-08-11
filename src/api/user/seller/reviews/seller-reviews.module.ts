import { Module } from '@nestjs/common';
import { ReviewRepositoryModule } from '@/_repositories/review/review.repository/review.repository.module';
import { ShopModule } from '@/modules/shop/shop.module';
import { SellerReviewsController } from './seller-reviews.controller';
import { SellerReviewsService } from './seller-reviews.service';

@Module({
  imports: [ReviewRepositoryModule, ShopModule],
  controllers: [SellerReviewsController],
  providers: [SellerReviewsService],
})
export class SellerReviewsModule {}
