import { Module } from '@nestjs/common';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { AdminTagGroupsController } from './admin-tag-groups.controller';
import { AdminTagGroupTranslationsService } from './services/admin-tag-group-translations.service';
import { AdminTagGroupsService } from './services/admin-tag-groups.service';
import { AdminTagsModule } from '../tags/admin-tags.module';

@Module({
  imports: [CatalogModule, AdminTagsModule],
  controllers: [AdminTagGroupsController],
  providers: [AdminTagGroupsService, AdminTagGroupTranslationsService],
  exports: [AdminTagGroupsService, AdminTagGroupTranslationsService],
})
export class AdminTagGroupsModule {}
