import { Injectable, NotFoundException } from '@nestjs/common';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';
import type { PublicCategoryResponse } from './list-public-categories.query';

@Injectable()
export class GetPublicCategoryByIdQuery {
  constructor(
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(
    id: string,
    lang: string = 'en',
  ): Promise<PublicCategoryResponse> {
    const category = await this.categoryAdminRepository.findPublicById(id);

    if (!category) {
      throw new NotFoundException(`Category ${id} not found.`);
    }

    const translation = resolveTranslation(category.translations, lang);
    const parentId = category.parentHierarchies[0]?.ancestorId ?? null;

    return {
      id: category.id,
      slug: category.slug,
      name: translation?.name ?? 'Unnamed Category',
      description: translation?.description ?? null,
      isActive: category.isActive,
      childrenCount: category.childrenCount,
      usageCount: category.usageCount,
      parentId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
