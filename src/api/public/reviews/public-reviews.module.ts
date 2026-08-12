import { Module } from '@nestjs/common';
import { ReviewModule } from '@/modules/review/review.module';
import { PublicReviewsController } from './public-reviews.controller';
import { PublicReviewsService } from './public-reviews.service';

@Module({
  imports: [ReviewModule],
  controllers: [PublicReviewsController],
  providers: [PublicReviewsService],
})
export class PublicReviewsModule {}
