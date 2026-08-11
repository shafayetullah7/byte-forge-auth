import { Injectable } from '@nestjs/common';
import { eq, isNull, and, sql } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  categoriesTable,
  TNewCategory,
  TCategory,
} from '@/_db/drizzle/schema/taxonomy';
import type { DrizzleTx, TLockTransaction } from '@/libs/db/types';

@Injectable()
export class CategoryRepository {
  constructor(private readonly db: DrizzleService) {}

  async findOne(
    id: string,
    transaction?: TLockTransaction,
  ): Promise<TCategory | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    const baseQuery = executor
      .select()
      .from(categoriesTable)
      .where(and(eq(categoriesTable.id, id), isNull(categoriesTable.deletedAt)))
      .limit(1);

    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const result = await lockQuery.execute();
    return result[0];
  }

  async findBySlug(
    slug: string,
    tx?: DrizzleTx,
  ): Promise<TCategory | undefined> {
    const executor = this.db.getExecutor(tx);
    const result = await executor
      .select()
      .from(categoriesTable)
      .where(
        and(eq(categoriesTable.slug, slug), isNull(categoriesTable.deletedAt)),
      )
      .limit(1);
    return result[0];
  }

  async create(data: TNewCategory, tx?: DrizzleTx): Promise<TCategory> {
    const executor = this.db.getExecutor(tx);
    const result = await executor
      .insert(categoriesTable)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<TNewCategory>,
    tx?: DrizzleTx,
  ): Promise<TCategory> {
    const executor = this.db.getExecutor(tx);
    const result = await executor
      .update(categoriesTable)
      .set(data)
      .where(and(eq(categoriesTable.id, id), isNull(categoriesTable.deletedAt)))
      .returning();
    return result[0];
  }

  async softDelete(id: string, tx?: DrizzleTx): Promise<void> {
    const executor = this.db.getExecutor(tx);
    await executor
      .update(categoriesTable)
      .set({
        deletedAt: new Date(),
        isActive: false,
        // Use the row id (not Date.now()) so bulk-deletes in a loop never produce duplicate slugs
        slug: sql`${categoriesTable.slug} || '-deleted-' || ${id}`,
      })
      .where(eq(categoriesTable.id, id));
  }

  async incrementChildrenCount(
    id: string,
    amount = 1,
    tx?: DrizzleTx,
  ): Promise<void> {
    const executor = this.db.getExecutor(tx);
    await executor
      .update(categoriesTable)
      .set({
        childrenCount: sql`${categoriesTable.childrenCount} + ${amount}`,
      })
      .where(eq(categoriesTable.id, id));
  }

  async decrementChildrenCount(
    id: string,
    amount = 1,
    tx?: DrizzleTx,
  ): Promise<void> {
    const executor = this.db.getExecutor(tx);
    await executor
      .update(categoriesTable)
      .set({
        childrenCount: sql`GREATEST(${categoriesTable.childrenCount} - ${amount}, 0)`,
      })
      .where(eq(categoriesTable.id, id));
  }

  async incrementUsageCount(
    id: string,
    amount = 1,
    tx?: DrizzleTx,
  ): Promise<void> {
    const executor = this.db.getExecutor(tx);
    await executor
      .update(categoriesTable)
      .set({
        usageCount: sql`${categoriesTable.usageCount} + ${amount}`,
      })
      .where(eq(categoriesTable.id, id));
  }

  async decrementUsageCount(
    id: string,
    amount = 1,
    tx?: DrizzleTx,
  ): Promise<void> {
    const executor = this.db.getExecutor(tx);
    await executor
      .update(categoriesTable)
      .set({
        usageCount: sql`GREATEST(${categoriesTable.usageCount} - ${amount}, 0)`,
      })
      .where(eq(categoriesTable.id, id));
  }
}
