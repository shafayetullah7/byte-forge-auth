import { Module } from '@nestjs/common';
import { ReviewModule } from '@/modules/review/review.module';
import { AdminReviewsController } from './admin-reviews.controller';
import { AdminReviewsService } from './admin-reviews.service';

@Module({
  imports: [ReviewModule],
  controllers: [AdminReviewsController],
  providers: [AdminReviewsService],
})
export class AdminReviewsModule {}
