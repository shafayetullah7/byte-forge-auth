import { BadRequestException, Injectable } from '@nestjs/common';
import type { CategoryImportNode } from '../../controllers/dto/bulk-import-categories.dto';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';

type CategoryExportRow = {
  id: string;
  slug: string;
  isActive: boolean;
  commissionRate: string | null;
  parentId: string | null;
};

type CategoryTranslationRow = {
  categoryId: string;
  locale: string;
  name: string;
  description: string | null;
};

@Injectable()
export class ExportCategoriesForImportQuery {
  constructor(
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(): Promise<{ items: CategoryImportNode[] }> {
    const categories = await this.categoryAdminRepository.listForImportExport();
    const translations =
      await this.categoryAdminRepository.listTranslationsByCategoryIds(
        categories.map((category) => category.id),
      );

    const translationsByCategoryId = new Map<string, CategoryTranslationRow[]>();
    for (const translation of translations) {
      const existing = translationsByCategoryId.get(translation.categoryId) ?? [];
      existing.push(translation);
      translationsByCategoryId.set(translation.categoryId, existing);
    }

    const missingEnglishNames = categories.filter((category) => {
      const categoryTranslations =
        translationsByCategoryId.get(category.id) ?? [];
      const english = categoryTranslations.find(
        (translation) => translation.locale === 'en',
      );
      return !english?.name?.trim();
    });

    if (missingEnglishNames.length > 0) {
      throw new BadRequestException(
        `Cannot export categories missing English names: ${missingEnglishNames
          .map((category) => category.slug)
          .join(', ')}`,
      );
    }

    return {
      items: this.buildExportTree(categories, translationsByCategoryId),
    };
  }

  private buildExportTree(
    categories: CategoryExportRow[],
    translationsByCategoryId: Map<string, CategoryTranslationRow[]>,
  ): CategoryImportNode[] {
    const nodeById = new Map<string, CategoryImportNode & { children: CategoryImportNode[] }>();

    for (const category of categories) {
      nodeById.set(category.id, {
        slug: category.slug,
        isActive: category.isActive,
        ...(category.commissionRate
          ? { commissionRate: Number(category.commissionRate) }
          : {}),
        translations: this.toTranslationRecord(
          translationsByCategoryId.get(category.id) ?? [],
        ),
        children: [],
      });
    }

    const roots: CategoryImportNode[] = [];

    for (const category of categories) {
      const node = nodeById.get(category.id)!;
      if (category.parentId && nodeById.has(category.parentId)) {
        nodeById.get(category.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots.map((node) => this.pruneEmptyChildren(node));
  }

  private toTranslationRecord(translations: CategoryTranslationRow[]) {
    const en = translations.find((translation) => translation.locale === 'en');
    const bn = translations.find((translation) => translation.locale === 'bn');

    return {
      en: {
        name: en?.name ?? '',
        description: en?.description ?? undefined,
      },
      ...(bn
        ? {
            bn: {
              name: bn.name,
              description: bn.description ?? undefined,
            },
          }
        : {}),
    };
  }

  private pruneEmptyChildren(
    node: CategoryImportNode & { children?: CategoryImportNode[] },
  ): CategoryImportNode {
    const children = node.children ?? [];
    const prunedChildren = children.map((child) => this.pruneEmptyChildren(child));

    return {
      slug: node.slug,
      isActive: node.isActive,
      ...(node.commissionRate !== undefined
        ? { commissionRate: node.commissionRate }
        : {}),
      translations: node.translations,
      ...(prunedChildren.length > 0 ? { children: prunedChildren } : {}),
    };
  }
}
