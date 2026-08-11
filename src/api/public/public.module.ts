import { Module } from '@nestjs/common';
import { PublicLocationModule } from './location/location.module';
import { PublicReviewsModule } from './reviews/public-reviews.module';

@Module({
  imports: [PublicLocationModule, PublicReviewsModule],
  exports: [PublicLocationModule, PublicReviewsModule],
})
export class PublicApiModule {}
