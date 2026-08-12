import { Injectable } from '@nestjs/common';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  childrenCount: number;
  parentId: string | null;
  children: CategoryTreeNode[];
};

@Injectable()
export class GetAdminCategoryTreeQuery {
  constructor(
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(lang: string) {
    const allCategories = await this.categoryAdminRepository.listForTree();
    const ids = allCategories.map((c) => c.id);
    const allTranslations =
      await this.categoryAdminRepository.listTranslationsByCategoryIds(ids);

    const localizedCategories = allCategories.map((cat) => {
      const translations = allTranslations.filter(
        (t) => t.categoryId === cat.id,
      );
      const translation = resolveTranslation(translations, lang);
      return {
        ...cat,
        name: translation?.name ?? cat.name,
      };
    });

    const categoryMap = new Map<string, CategoryTreeNode>();
    const tree: CategoryTreeNode[] = [];

    localizedCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    localizedCategories.forEach((cat) => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }
}
