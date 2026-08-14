import { BadRequestException } from '@nestjs/common';
import type { CategoryImportNode } from '../../controllers/dto/bulk-import-categories.dto';
import type { NormalizedCategoryImport } from './bulk-import-categories.types';

type TranslationInput = CategoryImportNode['translations'];

export function normalizeCategoryTranslations(
  translations: TranslationInput,
): NormalizedCategoryImport['translations'] {
  if (Array.isArray(translations)) {
    if (!translations.some((t) => t.locale === 'en')) {
      throw new BadRequestException('English (en) translation is required');
    }
    return translations.map((t) => ({
      locale: t.locale,
      name: t.name,
      description: t.description ?? null,
    }));
  }

  const normalized: NormalizedCategoryImport['translations'] = [
    {
      locale: 'en',
      name: translations.en.name,
      description: translations.en.description ?? null,
    },
  ];

  if (translations.bn?.name?.trim()) {
    normalized.push({
      locale: 'bn',
      name: translations.bn.name,
      description: translations.bn.description ?? null,
    });
  }

  return normalized;
}

export function flattenCategoryImportNodes(
  items: CategoryImportNode[],
): NormalizedCategoryImport[] {
  const flat: NormalizedCategoryImport[] = [];

  const walk = (
    nodes: CategoryImportNode[],
    parentSlug: string | null,
    depth: number,
    parentRef: string,
  ) => {
    nodes.forEach((node, index) => {
      const ref =
        parentRef === 'items'
          ? `items[${index}]`
          : `${parentRef}.children[${index}]`;
      const resolvedParentSlug =
        node.parentSlug === undefined ? parentSlug : node.parentSlug;

      flat.push({
        ref,
        slug: node.slug,
        parentSlug: resolvedParentSlug,
        depth,
        isActive: node.isActive ?? false,
        commissionRate: node.commissionRate,
        translations: normalizeCategoryTranslations(node.translations),
      });

      if (node.children?.length) {
        walk(node.children, node.slug, depth + 1, ref);
      }
    });
  };

  const hasExplicitParentSlugs = items.some(
    (item) => item.parentSlug !== undefined && item.parentSlug !== null,
  );
  const hasNestedChildren = items.some(
    (item) => (item.children?.length ?? 0) > 0,
  );

  if (hasNestedChildren) {
    walk(items, null, 0, 'items');
    return flat;
  }

  if (hasExplicitParentSlugs) {
    return items.map((item, index) => ({
      ref: `items[${index}]`,
      slug: item.slug,
      parentSlug: item.parentSlug ?? null,
      depth: 0,
      isActive: item.isActive ?? false,
      commissionRate: item.commissionRate,
      translations: normalizeCategoryTranslations(item.translations),
    }));
  }

  walk(items, null, 0, 'items');
  return flat;
}

export function assignFlatDepths(
  nodes: NormalizedCategoryImport[],
): NormalizedCategoryImport[] {
  const bySlug = new Map(nodes.map((node) => [node.slug, node]));
  const depthBySlug = new Map<string, number>();

  const resolveDepth = (node: NormalizedCategoryImport): number => {
    const cached = depthBySlug.get(node.slug);
    if (cached !== undefined) return cached;

    if (!node.parentSlug) {
      depthBySlug.set(node.slug, 0);
      return 0;
    }

    const parent = bySlug.get(node.parentSlug);
    if (parent) {
      const depth = resolveDepth(parent) + 1;
      depthBySlug.set(node.slug, depth);
      return depth;
    }

    depthBySlug.set(node.slug, 0);
    return 0;
  };

  return nodes.map((node) => ({
    ...node,
    depth: resolveDepth(node),
  }));
}

export function sortCategoriesForImport(
  nodes: NormalizedCategoryImport[],
): NormalizedCategoryImport[] {
  const bySlug = new Map(nodes.map((node) => [node.slug, node]));
  const sorted: NormalizedCategoryImport[] = [];
  const visited = new Set<string>();

  const visit = (node: NormalizedCategoryImport) => {
    if (visited.has(node.slug)) return;

    if (node.parentSlug) {
      const parentInBatch = bySlug.get(node.parentSlug);
      if (parentInBatch) {
        visit(parentInBatch);
      }
    }

    visited.add(node.slug);
    sorted.push(node);
  };

  nodes.forEach(visit);
  return sorted;
}
