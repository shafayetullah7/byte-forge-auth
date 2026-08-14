import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { TNewCategory } from '@/_db/drizzle/schema/taxonomy';
import type { BulkImportCategoriesDto } from '../../controllers/dto/bulk-import-categories.dto';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';
import { CategoryHierarchyRepository } from '../../repositories/category-hierarchy.repository';
import { CategoryRepository } from '../../repositories/category.repository';
import type {
  BulkImportCategoriesResult,
  BulkImportCategoriesRowResult,
  NormalizedCategoryImport,
} from './bulk-import-categories.types';
import {
  assignFlatDepths,
  flattenCategoryImportNodes,
  sortCategoriesForImport,
} from './bulk-import-categories.util';

const MAX_CATEGORY_DEPTH = 2;

@Injectable()
export class BulkImportCategoriesCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly categoryRepository: CategoryRepository,
    private readonly hierarchyRepository: CategoryHierarchyRepository,
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(dto: BulkImportCategoriesDto): Promise<BulkImportCategoriesResult> {
    const options = {
      dryRun: dto.options?.dryRun ?? false,
      onDuplicate: dto.options?.onDuplicate ?? 'skip',
    };

    const flattened = assignFlatDepths(flattenCategoryImportNodes(dto.items));
    this.assertUniqueSlugsInBatch(flattened);
    const nodes = sortCategoriesForImport(flattened);
    const results: BulkImportCategoriesRowResult[] = [];

    const slugSet = new Set(nodes.map((node) => node.slug));
    const parentSlugs = new Set(
      nodes
        .map((node) => node.parentSlug)
        .filter((slug): slug is string => Boolean(slug)),
    );

    const existingBySlug = await this.loadExistingCategories([
      ...slugSet,
      ...parentSlugs,
    ]);
    const dbDepthBySlug = new Map<string, number>();
    for (const [slug, category] of existingBySlug.entries()) {
      dbDepthBySlug.set(
        slug,
        await this.categoryAdminRepository.getMaxAncestorDepth(category.id),
      );
    }

    const slugToId = new Map<string, string>(
      [...existingBySlug.entries()].map(([slug, category]) => [
        slug,
        category.id,
      ]),
    );
    const slugToDepth = new Map<string, number>(dbDepthBySlug);
    const nodesToCreate: NormalizedCategoryImport[] = [];
    const nodesToUpdate: Array<{
      node: NormalizedCategoryImport;
      categoryId: string;
    }> = [];

    for (const node of nodes) {
      const depth = this.resolveDepth(node, slugToDepth, dbDepthBySlug);
      const parentId = this.resolveParentId(node, slugToId, existingBySlug);

      if (node.parentSlug && parentId === undefined) {
        results.push(this.errorRow(node, `Parent category '${node.parentSlug}' was not found`));
        continue;
      }

      if (depth < 0 || depth > MAX_CATEGORY_DEPTH) {
        results.push(
          this.errorRow(node, 'Category hierarchy cannot exceed 3 levels'),
        );
        continue;
      }

      if (parentId) {
        const parentDepth = slugToDepth.get(node.parentSlug!) ?? -1;
        if (parentDepth >= MAX_CATEGORY_DEPTH) {
          results.push(
            this.errorRow(node, 'Parent category is already at maximum depth'),
          );
          continue;
        }
      }

      const existing = existingBySlug.get(node.slug);
      if (existing) {
        if (options.onDuplicate === 'error') {
          results.push(
            this.errorRow(node, `Category '${node.slug}' already exists`),
          );
        } else if (options.onDuplicate === 'upsert') {
          results.push({
            ref: node.ref,
            entity: 'category',
            slug: node.slug,
            status: 'updated',
            id: existing.id,
            message: options.dryRun ? 'Would update category' : undefined,
          });
          nodesToUpdate.push({ node, categoryId: existing.id });
          slugToId.set(node.slug, existing.id);
          slugToDepth.set(node.slug, dbDepthBySlug.get(node.slug) ?? depth);
        } else {
          results.push({
            ref: node.ref,
            entity: 'category',
            slug: node.slug,
            status: 'skipped',
            id: existing.id,
            message: 'Category already exists',
          });
          slugToId.set(node.slug, existing.id);
          slugToDepth.set(node.slug, dbDepthBySlug.get(node.slug) ?? depth);
        }
        continue;
      }

      slugToId.set(node.slug, `pending-${node.slug}`);
      slugToDepth.set(node.slug, depth);
      nodesToCreate.push(node);
      results.push({
        ref: node.ref,
        entity: 'category',
        slug: node.slug,
        status: 'created',
        message: options.dryRun ? 'Would create category' : undefined,
      });
    }

    const errorCount = results.filter((row) => row.status === 'error').length;
    if (errorCount > 0) {
      return this.buildResult(options.dryRun, false, results);
    }

    if (options.dryRun || (nodesToCreate.length === 0 && nodesToUpdate.length === 0)) {
      return this.buildResult(true, true, results);
    }

    try {
      await this.db.transaction(async (tx) => {
        const createdSlugToId = new Map(slugToId);

        for (const { node, categoryId } of nodesToUpdate) {
          await this.categoryRepository.update(
            categoryId,
            {
              isActive: node.isActive,
              commissionRate:
                node.commissionRate !== undefined
                  ? node.commissionRate.toString()
                  : undefined,
            },
            tx,
          );
          await this.categoryAdminRepository.upsertTranslations(
            categoryId,
            node.translations.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
              description: translation.description ?? undefined,
            })),
            tx,
          );

          const result = results.find(
            (row) => row.ref === node.ref && row.entity === 'category',
          );
          if (result) {
            delete result.message;
          }
        }

        for (const node of nodesToCreate) {
          const parentId = node.parentSlug
            ? createdSlugToId.get(node.parentSlug) ?? null
            : null;

          const payload: TNewCategory = {
            slug: node.slug,
            isActive: node.isActive,
            commissionRate:
              node.commissionRate !== undefined
                ? node.commissionRate.toString()
                : null,
          };

          const category = await this.categoryRepository.create(payload, tx);
          await this.categoryAdminRepository.insertTranslations(
            category.id,
            node.translations.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
              description: translation.description ?? undefined,
            })),
            tx,
          );
          await this.hierarchyRepository.insertNode(tx, parentId, category.id);

          if (parentId) {
            await this.categoryRepository.incrementChildrenCount(parentId, 1, tx);
          }

          createdSlugToId.set(node.slug, category.id);
          const result = results.find(
            (row) => row.ref === node.ref && row.entity === 'category',
          );
          if (result) {
            result.id = category.id;
            delete result.message;
          }
        }
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          'A slug conflict occurred during import. No changes were saved.',
        );
      }
      throw error;
    }

    return this.buildResult(false, true, results);
  }

  private errorRow(
    node: NormalizedCategoryImport,
    message: string,
  ): BulkImportCategoriesRowResult {
    return {
      ref: node.ref,
      entity: 'category',
      slug: node.slug,
      status: 'error',
      message,
    };
  }

  private async loadExistingCategories(slugs: string[]) {
    const uniqueSlugs = [...new Set(slugs)];
    const entries = await Promise.all(
      uniqueSlugs.map(async (slug) => ({
        slug,
        category: await this.categoryRepository.findBySlug(slug),
      })),
    );

    return new Map(
      entries
        .filter((entry) => entry.category)
        .map((entry) => [entry.slug, entry.category!]),
    );
  }

  private resolveParentId(
    node: NormalizedCategoryImport,
    slugToId: Map<string, string>,
    existingBySlug: Map<string, { id: string }>,
  ): string | null | undefined {
    if (!node.parentSlug) return null;
    if (slugToId.has(node.parentSlug)) return slugToId.get(node.parentSlug)!;
    if (existingBySlug.has(node.parentSlug)) {
      return existingBySlug.get(node.parentSlug)!.id;
    }
    return undefined;
  }

  private resolveDepth(
    node: NormalizedCategoryImport,
    slugToDepth: Map<string, number>,
    dbDepthBySlug: Map<string, number>,
  ): number {
    if (!node.parentSlug) return 0;
    if (slugToDepth.has(node.parentSlug)) {
      return slugToDepth.get(node.parentSlug)! + 1;
    }
    if (dbDepthBySlug.has(node.parentSlug)) {
      return dbDepthBySlug.get(node.parentSlug)! + 1;
    }
    return node.depth;
  }

  private assertUniqueSlugsInBatch(nodes: NormalizedCategoryImport[]): void {
    const seen = new Set<string>();
    for (const node of nodes) {
      if (seen.has(node.slug)) {
        throw new BadRequestException(
          `Duplicate category slug in import payload: '${node.slug}'`,
        );
      }
      seen.add(node.slug);
    }
  }

  private buildResult(
    dryRun: boolean,
    success: boolean,
    results: BulkImportCategoriesRowResult[],
  ): BulkImportCategoriesResult {
    const categoriesCreated = results.filter(
      (row) => row.status === 'created',
    ).length;
    const categoriesUpdated = results.filter(
      (row) => row.status === 'updated',
    ).length;

    return {
      dryRun,
      success,
      summary: {
        created: categoriesCreated,
        skipped: results.filter((row) => row.status === 'skipped').length,
        updated: categoriesUpdated,
        errors: results.filter((row) => row.status === 'error').length,
        categoriesCreated,
      },
      results,
    };
  }
}
