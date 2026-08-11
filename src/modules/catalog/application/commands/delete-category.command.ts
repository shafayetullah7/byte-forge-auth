import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';
import { CategoryHierarchyRepository } from '../../repositories/category-hierarchy.repository';
import { CategoryRepository } from '../../repositories/category.repository';
import { GetAdminCategoryByIdQuery } from '../queries/get-admin-category-by-id.query';

@Injectable()
export class DeleteCategoryCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly categoryRepository: CategoryRepository,
    private readonly hierarchyRepository: CategoryHierarchyRepository,
    private readonly categoryAdminRepository: CategoryAdminRepository,
    private readonly getAdminCategoryByIdQuery: GetAdminCategoryByIdQuery,
  ) {}

  async execute(id: string, lang: string) {
    await this.getAdminCategoryByIdQuery.execute(id, lang);

    return await this.db.transaction(async (tx) => {
      const immediateParentId =
        await this.categoryAdminRepository.getImmediateParentIdForUpdate(
          id,
          tx,
        );

      const descendants =
        await this.categoryAdminRepository.listDescendantsWithUsage(id, tx);

      const hasUsage = descendants.some((d) => d.usageCount > 0);
      if (hasUsage) {
        throw new BadRequestException(
          'Cannot delete category or its subcategories. One or more items have products associated with them.',
        );
      }

      const descendantIds = descendants.map((d) => d.id);

      if (descendantIds.length > 0) {
        for (const dId of descendantIds) {
          await this.categoryRepository.softDelete(dId, tx);
        }
      }

      await this.hierarchyRepository.deleteSubtree(tx, id);

      if (immediateParentId) {
        await this.categoryRepository.decrementChildrenCount(
          immediateParentId,
          1,
          tx,
        );
      }
    });
  }
}
