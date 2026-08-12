import { Injectable, NotFoundException } from '@nestjs/common';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { CategoryRepository } from '../../repositories/category.repository';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';

@Injectable()
export class GetAdminCategoryByIdQuery {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(id: string, lang: string) {
    const category = await this.categoryRepository.findOne(id);
    if (!category) throw new NotFoundException(`Category ${id} not found.`);

    const parentId = await this.categoryAdminRepository.getImmediateParentId(
      category.id,
    );

    let parentName: string | null = null;
    if (parentId) {
      const parentTranslations =
        await this.categoryAdminRepository.listTranslations(parentId);
      const parentTranslation = resolveTranslation(parentTranslations, lang);
      parentName = parentTranslation?.name ?? 'Unnamed Category';
    }

    const translations = await this.categoryAdminRepository.listTranslations(
      category.id,
    );
    const translation = resolveTranslation(translations, lang);

    const childrenQuery = await this.categoryAdminRepository.listChildren(
      category.id,
    );
    const childIds = childrenQuery.map((c) => c.id);
    const childTranslations =
      await this.categoryAdminRepository.listTranslationsByCategoryIds(
        childIds,
      );

    const localizedChildren = childrenQuery.map((c) => {
      const trans = childTranslations.filter((t) => t.categoryId === c.id);
      const t = resolveTranslation(trans, lang);
      return {
        ...c,
        name: t?.name ?? 'Unnamed Category',
      };
    });

    return {
      ...category,
      name: translation?.name ?? 'Unnamed Category',
      description: translation?.description,
      parentName,
      parentId,
      children: localizedChildren,
      translations,
    };
  }
}
