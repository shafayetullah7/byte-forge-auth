import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  categoriesTable,
  categoryHierarchyTable,
  categoryTranslationsTable,
} from '@/_db/drizzle/schema/taxonomy';
import type { DrizzleTx } from '@/libs/db/types';
import type { CategoryQueryDto } from '../controllers/dto/category-query.dto';

@Injectable()
export class CategoryAdminRepository {
  constructor(private readonly db: DrizzleService) {}

  async getMaxAncestorDepth(descendantId: string): Promise<number> {
    const depthCheck = await this.db.client
      .select({ depth: categoryHierarchyTable.depth })
      .from(categoryHierarchyTable)
      .where(eq(categoryHierarchyTable.descendantId, descendantId))
      .orderBy(desc(categoryHierarchyTable.depth))
      .limit(1);

    return depthCheck.length > 0 ? depthCheck[0].depth : 0;
  }

  async insertTranslations(
    categoryId: string,
    translations: {
      locale: string;
      name: string;
      description?: string | null;
    }[],
    tx: DrizzleTx,
  ) {
    await tx.insert(categoryTranslationsTable).values(
      translations.map((t) => ({
        ...t,
        categoryId,
      })),
    );
  }

  async upsertTranslations(
    categoryId: string,
    translations: {
      locale: string;
      name: string;
      description?: string | null;
    }[],
    tx: DrizzleTx,
  ) {
    for (const t of translations) {
      await tx
        .insert(categoryTranslationsTable)
        .values({
          ...t,
          categoryId,
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

  async listPaginated(query: CategoryQueryDto) {
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

    return { data, total, page, limit };
  }

  async listForTree() {
    return this.db.client
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
  }

  async listTranslationsByCategoryIds(categoryIds: string[]) {
    if (categoryIds.length === 0) return [];
    return this.db.client
      .select()
      .from(categoryTranslationsTable)
      .where(inArray(categoryTranslationsTable.categoryId, categoryIds));
  }

  async getImmediateParentId(
    categoryId: string,
    tx?: DrizzleTx,
  ): Promise<string | null> {
    const executor = this.db.getExecutor(tx);
    const parent = await executor
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
          eq(categoryHierarchyTable.descendantId, categoryId),
          eq(categoryHierarchyTable.depth, 1),
        ),
      )
      .limit(1);

    return parent[0]?.id ?? null;
  }

  async getImmediateParentIdForUpdate(
    categoryId: string,
    tx: DrizzleTx,
  ): Promise<string | null> {
    const oldParentRow = await tx
      .select({ ancestorId: categoryHierarchyTable.ancestorId })
      .from(categoryHierarchyTable)
      .where(
        and(
          eq(categoryHierarchyTable.descendantId, categoryId),
          eq(categoryHierarchyTable.depth, 1),
        ),
      )
      .for('update')
      .limit(1);
    return oldParentRow[0]?.ancestorId ?? null;
  }

  async listChildren(categoryId: string) {
    return this.db.client
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
          eq(categoryHierarchyTable.ancestorId, categoryId),
          eq(categoryHierarchyTable.depth, 1),
        ),
      );
  }

  async listAncestors(categoryId: string) {
    return this.db.client
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
          eq(categoryHierarchyTable.descendantId, categoryId),
          gt(categoryHierarchyTable.depth, 0),
        ),
      )
      .orderBy(desc(categoryHierarchyTable.depth));
  }

  async isDescendant(
    ancestorId: string,
    candidateId: string,
    tx: DrizzleTx,
  ): Promise<boolean> {
    const rows = await tx
      .select({ id: categoryHierarchyTable.descendantId })
      .from(categoryHierarchyTable)
      .where(
        and(
          eq(categoryHierarchyTable.ancestorId, ancestorId),
          eq(categoryHierarchyTable.descendantId, candidateId),
        ),
      );
    return rows.length > 0;
  }

  async getMaxDepthForDescendant(
    descendantId: string,
    tx: DrizzleTx,
  ): Promise<number> {
    const parentDepthQuery = await tx
      .select({ depth: categoryHierarchyTable.depth })
      .from(categoryHierarchyTable)
      .where(eq(categoryHierarchyTable.descendantId, descendantId))
      .orderBy(desc(categoryHierarchyTable.depth))
      .limit(1);

    return parentDepthQuery.length > 0 ? parentDepthQuery[0].depth : 0;
  }

  async getSubtreeHeight(categoryId: string, tx: DrizzleTx): Promise<number> {
    const subtreeHeightQuery = await tx
      .select({
        height: sql<number>`MAX(${categoryHierarchyTable.depth})`,
      })
      .from(categoryHierarchyTable)
      .where(eq(categoryHierarchyTable.ancestorId, categoryId));

    return subtreeHeightQuery[0]?.height || 0;
  }

  async listDescendantsWithUsage(categoryId: string, tx: DrizzleTx) {
    return tx
      .select({
        id: categoriesTable.id,
        usageCount: categoriesTable.usageCount,
      })
      .from(categoryHierarchyTable)
      .innerJoin(
        categoriesTable,
        eq(categoriesTable.id, categoryHierarchyTable.descendantId),
      )
      .where(eq(categoryHierarchyTable.ancestorId, categoryId));
  }

  async listTranslations(categoryId: string) {
    return this.db.client
      .select()
      .from(categoryTranslationsTable)
      .where(eq(categoryTranslationsTable.categoryId, categoryId));
  }

  async upsertTranslation(
    categoryId: string,
    data: { locale: string; name: string; description?: string | null },
  ) {
    const [translation] = await this.db.client
      .insert(categoryTranslationsTable)
      .values({
        categoryId,
        locale: data.locale,
        name: data.name,
        description: data.description,
      })
      .onConflictDoUpdate({
        target: [
          categoryTranslationsTable.categoryId,
          categoryTranslationsTable.locale,
        ],
        set: { name: data.name, description: data.description },
      })
      .returning();

    return translation;
  }

  async deleteTranslation(categoryId: string, locale: string) {
    return this.db.client
      .delete(categoryTranslationsTable)
      .where(
        and(
          eq(categoryTranslationsTable.categoryId, categoryId),
          eq(categoryTranslationsTable.locale, locale),
        ),
      )
      .returning();
  }
}
