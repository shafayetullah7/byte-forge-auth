import { Injectable } from '@nestjs/common';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';

export type PublicCategoryResponse = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  childrenCount: number;
  usageCount: number;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ListPublicCategoriesQuery {
  constructor(
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(lang: string = 'en'): Promise<PublicCategoryResponse[]> {
    const activeCategories =
      await this.categoryAdminRepository.listActivePublic();

    return activeCategories.map((cat) => {
      const translation = resolveTranslation(cat.translations, lang);
      const parentId = cat.parentHierarchies[0]?.ancestorId ?? null;

      return {
        id: cat.id,
        slug: cat.slug,
        name: translation?.name ?? 'Unnamed Category',
        description: translation?.description ?? null,
        isActive: cat.isActive,
        childrenCount: cat.childrenCount,
        usageCount: cat.usageCount,
        parentId,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });
  }
}
