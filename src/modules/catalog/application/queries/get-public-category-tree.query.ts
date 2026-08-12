import { Injectable } from '@nestjs/common';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';

export type PublicCategoryTreeNode = {
  id: string;
  slug: string;
  name: string;
  childrenCount: number;
  parentId: string | null;
  children: PublicCategoryTreeNode[];
};

@Injectable()
export class GetPublicCategoryTreeQuery {
  constructor(
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(lang: string = 'en') {
    const allCategories =
      await this.categoryAdminRepository.listActiveForPublicTree();
    const ids = allCategories.map((c) => c.id);
    const allTranslations =
      await this.categoryAdminRepository.listTranslationsByCategoryIds(ids);

    const localizedCategories = allCategories.map((cat) => {
      const translations = allTranslations.filter(
        (t) => t.categoryId === cat.id,
      );
      const translation = resolveTranslation(translations, lang);
      return {
        id: cat.id,
        slug: cat.slug,
        name: translation?.name ?? cat.name,
        childrenCount: cat.childrenCount,
        parentId: cat.parentId,
      };
    });

    const categoryMap = new Map<string, PublicCategoryTreeNode>();
    const tree: PublicCategoryTreeNode[] = [];

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

    const calculateTotalDescendants = (
      node: PublicCategoryTreeNode,
    ): number => {
      if (node.children.length === 0) {
        return 0;
      }
      let count = node.children.length;
      for (const child of node.children) {
        count += calculateTotalDescendants(child);
      }
      return count;
    };

    tree.forEach((root) => {
      root.childrenCount = calculateTotalDescendants(root);
    });

    return tree;
  }
}
