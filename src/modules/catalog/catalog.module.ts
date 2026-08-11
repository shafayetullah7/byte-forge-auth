import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { AdminAuthGuardModule } from '@/common/guards/admin-auth-guard/admin-auth-guard.module';
import {
  CreateCategoryCommand,
  DeleteCategoryCommand,
  DeleteCategoryTranslationCommand,
  UpdateCategoryCommand,
  UpsertCategoryTranslationCommand,
} from './application/commands';
import {
  CatalogQueryService,
  GetAdminCategoryAncestorsQuery,
  GetAdminCategoryByIdQuery,
  GetAdminCategoryTreeQuery,
  ListAdminCategoriesQuery,
  ListCategoryTranslationsQuery,
} from './application/queries';
import { AdminCategoriesController } from './controllers';
import {
  CategoryAdminRepository,
  CategoryHierarchyRepository,
  CategoryRepository,
  TagGroupRepository,
  TagRepository,
} from './repositories';

@Module({
  imports: [DrizzleModule, AdminAuthGuardModule],
  controllers: [AdminCategoriesController],
  providers: [
    CategoryRepository,
    CategoryHierarchyRepository,
    CategoryAdminRepository,
    TagRepository,
    TagGroupRepository,
    CatalogQueryService,
    ListAdminCategoriesQuery,
    GetAdminCategoryTreeQuery,
    GetAdminCategoryByIdQuery,
    GetAdminCategoryAncestorsQuery,
    ListCategoryTranslationsQuery,
    CreateCategoryCommand,
    UpdateCategoryCommand,
    DeleteCategoryCommand,
    UpsertCategoryTranslationCommand,
    DeleteCategoryTranslationCommand,
  ],
  exports: [
    CatalogQueryService,
    // Temporary: seller plants + admin tags still inject repos until Phases 31–34.
    CategoryRepository,
    CategoryHierarchyRepository,
    TagRepository,
    TagGroupRepository,
  ],
})
export class CatalogModule {}
