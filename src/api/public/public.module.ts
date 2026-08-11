import { Module } from '@nestjs/common';
import { PublicPlantsModule } from './plants/plants.module';
import { PublicLocationModule } from './location/location.module';
import { PublicReviewsModule } from './reviews/public-reviews.module';

@Module({
  imports: [PublicPlantsModule, PublicLocationModule, PublicReviewsModule],
  exports: [PublicPlantsModule, PublicLocationModule, PublicReviewsModule],
})
export class PublicApiModule {}
