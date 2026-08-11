import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CategoryRepository } from '@/modules/catalog/repositories';
import { CategoryHierarchyRepository } from '@/modules/catalog/repositories';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  categoryHierarchyTable,
  categoriesTable,
  TNewCategory,
  categoryTranslationsTable,
} from '@/_db/drizzle/schema/taxonomy';
import {
  eq,
  and,
  sql,
  desc,
  isNull,
  gt,
  inArray,
  count,
  asc,
  SQL,
} from 'drizzle-orm';

import { paginate } from '@/common/utils/pagination.util';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';

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
export class AdminCategoriesService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly hierarchyRepository: CategoryHierarchyRepository,
    private readonly db: DrizzleService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne(
        createCategoryDto.parentId,
      );
      if (!parent)
        throw new BadRequestException(
          `Parent Category ${createCategoryDto.parentId} not found.`,
        );

      const depthCheck = await this.db.client
        .select({ depth: categoryHierarchyTable.depth })
        .from(categoryHierarchyTable)
        .where(
          eq(categoryHierarchyTable.descendantId, createCategoryDto.parentId),
        )
        .orderBy(desc(categoryHierarchyTable.depth))
        .limit(1);

      const maxExistingDepth = depthCheck.length > 0 ? depthCheck[0].depth : 0;
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

        await tx.insert(categoryTranslationsTable).values(
          translations.map((t) => ({
            ...t,
            categoryId: newCat.id,
          })),
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
    } catch (error: any) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          `Category with slug '${createCategoryDto.slug}' already exists.`,
        );
      }
      throw error;
    }
  }

  async findAll(query: CategoryQueryDto, lang: string) {
    const limit = query.limit ? Number(query.limit) : 20;
    const page = query.page ? Number(query.page) : 1;
    const offset = (page - 1) * limit;

    const where: SQL[] = [isNull(categoriesTable.deletedAt)];
    if (query.isActive !== undefined) {
      where.push(eq(categoriesTable.isActive, query.isActive === 'true'));
    }

    const whereClause = and(...where);

    const sortByField =
      query.sortBy === 'updatedAt'
        ? categoriesTable.updatedAt
        : categoriesTable.createdAt;
    const sortFn = query.sortOrder === 'asc' ? asc : desc;

    const [data, [{ total }]] = await Promise.all([
      this.db.client.query.categoriesTable.findMany({
        where: whereClause,
        orderBy: [sortFn(sortByField)],
        limit,
        offset,
        with: {
          translations: true,
          parentHierarchies: {
            where: eq(categoryHierarchyTable.depth, 1),
            columns: { ancestorId: true },
          },
        },
      }),
      this.db.client
        .select({ total: count() })
        .from(categoriesTable)
        .where(whereClause),
    ]);

    const enriched = data.map((cat) => {
      const { translations, parentHierarchies, ...rest } = cat;
      const translation = resolveTranslation(translations, lang);
      const parentId = parentHierarchies[0]?.ancestorId ?? null;

      return {
        ...rest,
        name: translation?.name ?? 'Unnamed Category',
        description: translation?.description,
        parentId,
        translations,
      };
    });

    return paginate(enriched, total, page, limit);
  }

  async getTree(lang: string) {
    const allCategories = await this.db.client
      .select({
        id: categoriesTable.id,
        name: sql<string>`COALESCE(${categoryTranslationsTable.name}, 'Unnamed Category')`,
        slug: categoriesTable.slug,
        isActive: categoriesTable.isActive,
        childrenCount: categoriesTable.childrenCount,
        parentId: sql<string | null>`(
          SELECT ancestor_id
          FROM ${categoryHierarchyTable}
          WHERE descendant_id = ${categoriesTable.id} AND depth = 1
        )`,
      })
      .from(categoriesTable)
      .leftJoin(
        categoryTranslationsTable,
        and(
          eq(categoryTranslationsTable.categoryId, categoriesTable.id),
          eq(categoryTranslationsTable.locale, 'en'),
        ),
      )
      .where(isNull(categoriesTable.deletedAt));

    const ids = allCategories.map((c) => c.id);
    const allTranslations = await this.db.client
      .select()
      .from(categoryTranslationsTable)
      .where(inArray(categoryTranslationsTable.categoryId, ids));

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

  async findOne(id: string, lang: string) {
    const category = await this.categoryRepository.findOne(id);
    if (!category) throw new NotFoundException(`Category ${id} not found.`);

    const parent = await this.db.client
      .select({
        id: categoriesTable.id,
      })
      .from(categoryHierarchyTable)
      .innerJoin(
        categoriesTable,
        eq(categoriesTable.id, categoryHierarchyTable.ancestorId),
      )
      .where(
        and(
          eq(categoryHierarchyTable.descendantId, category.id),
          eq(categoryHierarchyTable.depth, 1),
        ),
      )
      .limit(1);

    let parentName: string | null = null;
    let parentId: string | null = null;
    if (parent.length > 0) {
      parentId = parent[0].id;
      const parentTranslations = await this.db.client
        .select()
        .from(categoryTranslationsTable)
        .where(eq(categoryTranslationsTable.categoryId, parentId));
      const parentTranslation = resolveTranslation(parentTranslations, lang);
      parentName = parentTranslation?.name ?? 'Unnamed Category';
    }

    const translations = await this.db.client
      .select()
      .from(categoryTranslationsTable)
      .where(eq(categoryTranslationsTable.categoryId, category.id));

    const translation = resolveTranslation(translations, lang);

    const childrenQuery = await this.db.client
      .select({
        id: categoriesTable.id,
        slug: categoriesTable.slug,
        isActive: categoriesTable.isActive,
        childrenCount: categoriesTable.childrenCount,
      })
      .from(categoryHierarchyTable)
      .innerJoin(
        categoriesTable,
        eq(categoriesTable.id, categoryHierarchyTable.descendantId),
      )
      .where(
        and(
          eq(categoryHierarchyTable.ancestorId, category.id),
          eq(categoryHierarchyTable.depth, 1),
        ),
      );

    const childIds = childrenQuery.map((c) => c.id);
    const childTranslations =
      childIds.length > 0
        ? await this.db.client
            .select()
            .from(categoryTranslationsTable)
            .where(inArray(categoryTranslationsTable.categoryId, childIds))
        : [];

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

  async getAncestors(id: string) {
    const category = await this.categoryRepository.findOne(id);
    if (!category) throw new NotFoundException(`Category ${id} not found.`);

    const ancestors = await this.db.client
      .select({
        id: categoriesTable.id,
        name: sql<string>`COALESCE(${categoryTranslationsTable.name}, 'Unnamed Category')`,
        slug: categoriesTable.slug,
        depth: categoryHierarchyTable.depth,
      })
      .from(categoryHierarchyTable)
      .innerJoin(
        categoriesTable,
        eq(categoriesTable.id, categoryHierarchyTable.ancestorId),
      )
      .leftJoin(
        categoryTranslationsTable,
        and(
          eq(categoryTranslationsTable.categoryId, categoriesTable.id),
          eq(categoryTranslationsTable.locale, 'en'),
        ),
      )
      .where(
        and(
          eq(categoryHierarchyTable.descendantId, id),
          gt(categoryHierarchyTable.depth, 0),
        ),
      )
      .orderBy(desc(categoryHierarchyTable.depth));

    return ancestors;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, lang: string) {
    await this.findOne(id, lang);

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
          if (parentId === id)
            throw new BadRequestException(
              'A category cannot be its own parent.',
            );

          const oldParentRow = await tx
            .select({ ancestorId: categoryHierarchyTable.ancestorId })
            .from(categoryHierarchyTable)
            .where(
              and(
                eq(categoryHierarchyTable.descendantId, id),
                eq(categoryHierarchyTable.depth, 1),
              ),
            )
            .for('update')
            .limit(1);
          const oldParentId = oldParentRow[0]?.ancestorId ?? null;

          if (parentId) {
            const parentExists =
              await this.categoryRepository.findOne(parentId);
            if (!parentExists)
              throw new BadRequestException(
                `Parent Category ${parentId} not found.`,
              );

            const isDescendant = await tx
              .select({ id: categoryHierarchyTable.descendantId })
              .from(categoryHierarchyTable)
              .where(
                and(
                  eq(categoryHierarchyTable.ancestorId, id),
                  eq(categoryHierarchyTable.descendantId, parentId),
                ),
              );

            if (isDescendant.length > 0) {
              throw new BadRequestException(
                'Cannot move a category under its own descendant (Circular Reference).',
              );
            }

            const parentDepthQuery = await tx
              .select({ depth: categoryHierarchyTable.depth })
              .from(categoryHierarchyTable)
              .where(eq(categoryHierarchyTable.descendantId, parentId))
              .orderBy(desc(categoryHierarchyTable.depth))
              .limit(1);

            const newParentDepth =
              parentDepthQuery.length > 0 ? parentDepthQuery[0].depth : 0;

            const subtreeHeightQuery = await tx
              .select({
                height: sql<number>`MAX(${categoryHierarchyTable.depth})`,
              })
              .from(categoryHierarchyTable)
              .where(eq(categoryHierarchyTable.ancestorId, id));

            const subtreeHeight = subtreeHeightQuery[0]?.height || 0;

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
          for (const t of translations) {
            await tx
              .insert(categoryTranslationsTable)
              .values({
                ...t,
                categoryId: id,
              })
              .onConflictDoUpdate({
                target: [
                  categoryTranslationsTable.categoryId,
                  categoryTranslationsTable.locale,
                ],
                set: {
                  name: t.name,
                  description: t.description,
                },
              });
          }
        }

        if (Object.keys(payload).length > 0) {
          await this.categoryRepository.update(id, payload, tx);
        }

        return this.findOne(id, lang);
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

  async remove(id: string, lang: string) {
    await this.findOne(id, lang);

    return await this.db.transaction(async (tx) => {
      const parentRow = await tx
        .select({ ancestorId: categoryHierarchyTable.ancestorId })
        .from(categoryHierarchyTable)
        .where(
          and(
            eq(categoryHierarchyTable.descendantId, id),
            eq(categoryHierarchyTable.depth, 1),
          ),
        )
        .for('update')
        .limit(1);
      const immediateParentId = parentRow[0]?.ancestorId ?? null;

      const descendants = await tx
        .select({
          id: categoriesTable.id,
          usageCount: categoriesTable.usageCount,
        })
        .from(categoryHierarchyTable)
        .innerJoin(
          categoriesTable,
          eq(categoriesTable.id, categoryHierarchyTable.descendantId),
        )
        .where(eq(categoryHierarchyTable.ancestorId, id));

      const hasUsage = descendants.some((d) => d.usageCount > 0);
      if (hasUsage) {
        throw new BadRequestException(
          'Cannot delete category or its subcategories. One or more items have products associated with them.',
        );
      }

      const descendantIds = descendants.map((d) => d.id);

      if (descendantIds.length > 0) {
        for (const dId of descendantIds) {
          await this.categoryRepository.softDelete(dId, tx);
        }
      }

      await this.hierarchyRepository.deleteSubtree(tx, id);

      if (immediateParentId) {
        await this.categoryRepository.decrementChildrenCount(
          immediateParentId,
          1,
          tx,
        );
      }
    });
  }
}
