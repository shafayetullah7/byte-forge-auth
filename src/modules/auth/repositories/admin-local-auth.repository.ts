import { SQL, eq, and } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  adminLocalAuthTable,
  TAdminLocalAuth,
  TNewAdminLocalAuth,
} from '@/_db/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { DrizzleTx } from '@/_db/drizzle/types';

export interface AdminLocalAuthQuery {
  adminId?: string;
  email?: string;
  verified?: boolean;
}

@Injectable()
export class AdminLocalAuthRepository {
  constructor(private readonly db: DrizzleService) {}

  private buildWhere(options?: AdminLocalAuthQuery): SQL[] {
    if (!options) return [];

    const where: SQL[] = [];

    if (options.adminId)
      where.push(eq(adminLocalAuthTable.adminId, options.adminId));
    if (options.email) where.push(eq(adminLocalAuthTable.email, options.email));
    if (options.verified !== undefined)
      where.push(eq(adminLocalAuthTable.verfied, options.verified));

    return where;
  }

  async findOne(
    options?: AdminLocalAuthQuery,
    tx?: DrizzleTx,
  ): Promise<TAdminLocalAuth | null> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(options);
    const [row] = await executor
      .select()
      .from(adminLocalAuthTable)
      .where(and(...where))
      .limit(1)
      .execute();
    return row ?? null;
  }

  async create(
    data: TNewAdminLocalAuth,
    tx?: DrizzleTx,
  ): Promise<TAdminLocalAuth> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(adminLocalAuthTable)
      .values(data)
      .returning();
    return row;
  }
}
