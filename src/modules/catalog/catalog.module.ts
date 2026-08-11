import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { CatalogQueryService } from './application/queries';
import {
  CategoryHierarchyRepository,
  CategoryRepository,
  TagGroupRepository,
  TagRepository,
} from './repositories';

@Module({
  imports: [DrizzleModule],
  providers: [
    CategoryRepository,
    CategoryHierarchyRepository,
    TagRepository,
    TagGroupRepository,
    CatalogQueryService,
  ],
  exports: [
    CatalogQueryService,
    // Temporary: admin taxonomy + seller plants still inject repos directly
    // until Phases 30–34 move those surfaces into catalog controllers/commands.
    CategoryRepository,
    CategoryHierarchyRepository,
    TagRepository,
    TagGroupRepository,
  ],
})
export class CatalogModule {}
