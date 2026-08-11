import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { TNewCategory } from '@/_db/drizzle/schema/taxonomy';
import type { UpdateCategoryDto } from '../../controllers/dto/update-category.dto';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';
import { CategoryHierarchyRepository } from '../../repositories/category-hierarchy.repository';
import { CategoryRepository } from '../../repositories/category.repository';
import { GetAdminCategoryByIdQuery } from '../queries/get-admin-category-by-id.query';

@Injectable()
export class UpdateCategoryCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly categoryRepository: CategoryRepository,
    private readonly hierarchyRepository: CategoryHierarchyRepository,
    private readonly categoryAdminRepository: CategoryAdminRepository,
    private readonly getAdminCategoryByIdQuery: GetAdminCategoryByIdQuery,
  ) {}

  async execute(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    lang: string,
  ) {
    await this.getAdminCategoryByIdQuery.execute(id, lang);

    const { parentId, translations, ...catData } = updateCategoryDto;

    const payload: Partial<TNewCategory> = {
      ...catData,
      commissionRate:
        catData.commissionRate !== undefined
          ? catData.commissionRate.toString()
          : undefined,
    };

    try {
      return await this.db.transaction(async (tx) => {
        if (parentId !== undefined) {
          if (parentId === id) {
            throw new BadRequestException(
              'A category cannot be its own parent.',
            );
          }

          const oldParentId =
            await this.categoryAdminRepository.getImmediateParentIdForUpdate(
              id,
              tx,
            );

          if (parentId) {
            const parentExists =
              await this.categoryRepository.findOne(parentId);
            if (!parentExists) {
              throw new BadRequestException(
                `Parent Category ${parentId} not found.`,
              );
            }

            const circular = await this.categoryAdminRepository.isDescendant(
              id,
              parentId,
              tx,
            );
            if (circular) {
              throw new BadRequestException(
                'Cannot move a category under its own descendant (Circular Reference).',
              );
            }

            const newParentDepth =
              await this.categoryAdminRepository.getMaxDepthForDescendant(
                parentId,
                tx,
              );
            const subtreeHeight =
              await this.categoryAdminRepository.getSubtreeHeight(id, tx);

            if (newParentDepth + 1 + subtreeHeight > 2) {
              throw new BadRequestException(
                'Relocation would exceed the 3-level hierarchy limit.',
              );
            }
          }

          await this.hierarchyRepository.moveSubtree(tx, id, parentId || null);

          if (oldParentId !== parentId) {
            if (oldParentId) {
              await this.categoryRepository.decrementChildrenCount(
                oldParentId,
                1,
                tx,
              );
            }
            if (parentId) {
              await this.categoryRepository.incrementChildrenCount(
                parentId,
                1,
                tx,
              );
            }
          }
        }

        if (translations && translations.length > 0) {
          await this.categoryAdminRepository.upsertTranslations(
            id,
            translations,
            tx,
          );
        }

        if (Object.keys(payload).length > 0) {
          await this.categoryRepository.update(id, payload, tx);
        }

        return this.getAdminCategoryByIdQuery.execute(id, lang);
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          `Category with slug '${catData.slug}' already exists.`,
        );
      }
      throw error;
    }
  }
}
