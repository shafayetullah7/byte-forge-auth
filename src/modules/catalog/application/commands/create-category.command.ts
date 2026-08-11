import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { TNewCategory } from '@/_db/drizzle/schema/taxonomy';
import type { CreateCategoryDto } from '../../controllers/dto/create-category.dto';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';
import { CategoryHierarchyRepository } from '../../repositories/category-hierarchy.repository';
import { CategoryRepository } from '../../repositories/category.repository';

@Injectable()
export class CreateCategoryCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly categoryRepository: CategoryRepository,
    private readonly hierarchyRepository: CategoryHierarchyRepository,
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(createCategoryDto: CreateCategoryDto) {
    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne(
        createCategoryDto.parentId,
      );
      if (!parent) {
        throw new BadRequestException(
          `Parent Category ${createCategoryDto.parentId} not found.`,
        );
      }

      const maxExistingDepth =
        await this.categoryAdminRepository.getMaxAncestorDepth(
          createCategoryDto.parentId,
        );
      if (maxExistingDepth >= 2) {
        throw new BadRequestException(
          'Category hierarchy cannot exceed 3 levels.',
        );
      }
    }

    const existing = await this.categoryRepository.findBySlug(
      createCategoryDto.slug,
    );
    if (existing) {
      throw new BadRequestException(
        `Category with slug '${createCategoryDto.slug}' already exists.`,
      );
    }

    const { parentId, translations, ...categoryPayload } = createCategoryDto;
    const baseEnglishName = translations.find((t) => t.locale === 'en')?.name;

    if (!baseEnglishName) {
      throw new BadRequestException('Base English translation is required.');
    }

    try {
      return await this.db.transaction(async (tx) => {
        const finalPayload: TNewCategory = {
          ...categoryPayload,
          isActive: categoryPayload.isActive ?? false,
          commissionRate:
            categoryPayload.commissionRate !== undefined
              ? categoryPayload.commissionRate.toString()
              : null,
        };

        const newCat = await this.categoryRepository.create(finalPayload, tx);

        await this.categoryAdminRepository.insertTranslations(
          newCat.id,
          translations,
          tx,
        );

        await this.hierarchyRepository.insertNode(
          tx,
          parentId || null,
          newCat.id,
        );

        if (parentId) {
          await this.categoryRepository.incrementChildrenCount(parentId, 1, tx);
        }

        return { ...newCat, name: baseEnglishName, translations };
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          `Category with slug '${createCategoryDto.slug}' already exists.`,
        );
      }
      throw error;
    }
  }
}
