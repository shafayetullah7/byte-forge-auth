import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  tagGroupsTable,
  tagGroupTranslationsTable,
  TNewTagGroup,
  TTagGroup,
} from '@/_db/drizzle/schema/taxonomy';
import { Injectable } from '@nestjs/common';
import { eq, isNull, and, SQL, sql } from 'drizzle-orm';
import type { DrizzleTx, TLockTransaction } from '@/libs/db/types';
import { TagGroupQueryDto } from '../controllers/dto/tag-group-query.dto';

@Injectable()
export class TagGroupRepository {
  constructor(private readonly db: DrizzleService) {}

  private buildWhere(options: TagGroupQueryDto) {
    const where: SQL[] = [];

    if (options.id) where.push(eq(tagGroupsTable.id, options.id));
    // Name and search filters are now handled in the service layer using i18n translation tables

    if (options.isActive !== undefined) {
      where.push(eq(tagGroupsTable.isActive, options.isActive === 'true'));
    }

    // Default to showing only non-deleted
    where.push(isNull(tagGroupsTable.deletedAt));

    return and(...where);
  }

  async findOne(
    id: string,
    transaction?: TLockTransaction,
  ): Promise<(TTagGroup & { tags: any[] }) | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    return await executor.query.tagGroupsTable.findFirst({
      where: and(eq(tagGroupsTable.id, id), isNull(tagGroupsTable.deletedAt)),
      with: {
        tags: {
          where: (tags, { isNull }) => isNull(tags.deletedAt),
        },
      },
    });
  }

  async findBySlug(
    slug: string,
    transaction?: TLockTransaction,
  ): Promise<TTagGroup | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    const result = await executor.query.tagGroupsTable.findFirst({
      where: and(
        eq(tagGroupsTable.slug, slug),
        isNull(tagGroupsTable.deletedAt),
      ),
    });
    return result;
  }

  async create(
    data: { slug: string; isActive?: boolean },
    tx?: DrizzleTx,
  ): Promise<TTagGroup> {
    const executor = this.db.getExecutor(tx);
    const result = await executor
      .insert(tagGroupsTable)
      .values({
        slug: data.slug,
        isActive: data.isActive ?? true,
      })
      .returning();
    return result[0];
  }

  async createTranslations(
    groupId: string,
    translations: { locale: string; name: string; description?: string }[],
    tx?: DrizzleTx,
  ) {
    if (!translations.length) return [];

    const executor = this.db.getExecutor(tx);
    return await executor
      .insert(tagGroupTranslationsTable)
      .values(
        translations.map((t) => ({
          groupId,
          locale: t.locale,
          name: t.name,
          description: t.description,
        })),
      )
      .returning();
  }

  async upsertTranslations(
    groupId: string,
    translations: { locale: string; name: string; description?: string | null }[],
    tx?: DrizzleTx,
  ) {
    if (!translations.length) return;

    const executor = this.db.getExecutor(tx);
    for (const translation of translations) {
      await executor
        .insert(tagGroupTranslationsTable)
        .values({
          groupId,
          locale: translation.locale,
          name: translation.name,
          description: translation.description ?? undefined,
        })
        .onConflictDoUpdate({
          target: [
            tagGroupTranslationsTable.groupId,
            tagGroupTranslationsTable.locale,
          ],
          set: {
            name: translation.name,
            description: translation.description ?? undefined,
          },
        });
    }
  }

  async update(
    id: string,
    data: Partial<TNewTagGroup>,
    tx?: DrizzleTx,
  ): Promise<TTagGroup> {
    const executor = this.db.getExecutor(tx);
    const result = await executor
      .update(tagGroupsTable)
      .set(data)
      .where(and(eq(tagGroupsTable.id, id), isNull(tagGroupsTable.deletedAt)))
      .returning();

    return result[0];
  }

  async softDelete(id: string, tx?: DrizzleTx): Promise<void> {
    const executor = this.db.getExecutor(tx);

    // 1. Hard-delete orphaned translations (no longer reachable after soft-delete)
    await executor
      .delete(tagGroupTranslationsTable)
      .where(eq(tagGroupTranslationsTable.groupId, id));

    // 2. Soft-delete the group, mangling the slug to free the unique slot
    await executor
      .update(tagGroupsTable)
      .set({
        deletedAt: new Date(),
        isActive: false,
        slug: sql`${tagGroupsTable.slug} || '-deleted-' || ${Date.now()}`,
      })
      .where(eq(tagGroupsTable.id, id));
  }

  async incrementTagCount(
    id: string,
    amount = 1,
    tx?: DrizzleTx,
  ): Promise<void> {
    const executor = this.db.getExecutor(tx);
    await executor
      .update(tagGroupsTable)
      .set({
        tagCount: sql`${tagGroupsTable.tagCount} + ${amount}`,
      })
      .where(eq(tagGroupsTable.id, id));
  }

  async decrementTagCount(
    id: string,
    amount = 1,
    tx?: DrizzleTx,
  ): Promise<void> {
    const executor = this.db.getExecutor(tx);
    await executor
      .update(tagGroupsTable)
      .set({
        // GREATEST prevents the counter from going below zero on any double-fire
        tagCount: sql`GREATEST(${tagGroupsTable.tagCount} - ${amount}, 0)`,
      })
      .where(eq(tagGroupsTable.id, id));
  }
}
