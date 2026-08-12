import { SQL, eq, and } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  adminSessionTable,
  TAdminSession,
  TNewAdminSession,
} from '@/_db/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { DrizzleTx } from '@/_db/drizzle/types';

export interface AdminSessionQuery {
  id?: string;
  adminId?: string;
  sessionId?: string;
}

@Injectable()
export class AdminSessionRepository {
  constructor(private readonly db: DrizzleService) {}

  private buildWhere(options?: AdminSessionQuery): SQL[] {
    if (!options) return [];

    const where: SQL[] = [];

    if (options.id) where.push(eq(adminSessionTable.id, options.id));
    if (options.adminId)
      where.push(eq(adminSessionTable.adminId, options.adminId));
    if (options.sessionId)
      where.push(eq(adminSessionTable.sessionId, options.sessionId));

    return where;
  }

  async findOne(
    options?: AdminSessionQuery,
    tx?: DrizzleTx,
  ): Promise<TAdminSession | null> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(options);
    const [row] = await executor
      .select()
      .from(adminSessionTable)
      .where(and(...where))
      .limit(1)
      .execute();
    return row ?? null;
  }

  async create(data: TNewAdminSession, tx?: DrizzleTx): Promise<TAdminSession> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(adminSessionTable)
      .values(data)
      .returning();
    return row;
  }

  async delete(where: SQL, tx?: DrizzleTx): Promise<boolean> {
    const executor = this.db.getExecutor(tx);
    const deleted = await executor
      .delete(adminSessionTable)
      .where(where)
      .returning()
      .execute();
    return deleted.length > 0;
  }
}
