import { Module } from '@nestjs/common';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { AdminTagsController } from './admin-tags.controller';
import { AdminTagsService } from './services/admin-tags.service';
import { AdminTagTranslationsService } from './services/admin-tag-translations.service';

@Module({
  imports: [CatalogModule],
  controllers: [AdminTagsController],
  providers: [AdminTagsService, AdminTagTranslationsService],
  exports: [AdminTagsService, AdminTagTranslationsService],
})
export class AdminTagsModule {}
