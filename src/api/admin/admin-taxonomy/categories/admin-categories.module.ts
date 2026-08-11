import { Module } from '@nestjs/common';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminCategoryTranslationsService } from './services/admin-category-translations.service';
import { AdminCategoriesController } from './admin-categories.controller';
import { CatalogModule } from '@/modules/catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  controllers: [AdminCategoriesController],
  providers: [AdminCategoriesService, AdminCategoryTranslationsService],
  exports: [AdminCategoriesService, AdminCategoryTranslationsService],
})
export class AdminCategoriesModule {}
