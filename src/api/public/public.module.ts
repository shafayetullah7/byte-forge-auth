import { Module } from '@nestjs/common';
import { PublicCategoriesModule } from './categories/categories.module';
import { PublicTagsModule } from './tags/tags.module';
import { PublicPlantsModule } from './plants/plants.module';
import { PublicLocationModule } from './location/location.module';
import { PublicReviewsModule } from './reviews/public-reviews.module';

@Module({
  imports: [
    PublicCategoriesModule,
    PublicTagsModule,
    PublicPlantsModule,
    PublicLocationModule,
    PublicReviewsModule,
  ],
  exports: [
    PublicCategoriesModule,
    PublicTagsModule,
    PublicPlantsModule,
    PublicLocationModule,
    PublicReviewsModule,
  ],
})
export class PublicApiModule {}
