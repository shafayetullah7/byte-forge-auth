import { SQL, eq, and } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  userLocalAuthTable,
  TUserLocalAuth,
  TNewUserLocalAuth,
} from '@/_db/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { DrizzleTx } from '@/_db/drizzle/types';

export interface UserLocalAuthQuery {
  id?: string;
  userId?: string;
  email?: string;
  verified?: boolean;
}

@Injectable()
export class UserLocalAuthRepository {
  constructor(private readonly db: DrizzleService) {}

  private buildWhere(options?: UserLocalAuthQuery): SQL[] {
    if (!options) return [];

    const where: SQL[] = [];

    if (options.id) where.push(eq(userLocalAuthTable.id, options.id));
    if (options.userId)
      where.push(eq(userLocalAuthTable.userId, options.userId));
    if (options.email) where.push(eq(userLocalAuthTable.email, options.email));
    if (options.verified !== undefined)
      where.push(eq(userLocalAuthTable.verified, options.verified));

    return where;
  }

  async findOne(
    options?: UserLocalAuthQuery,
    tx?: DrizzleTx,
  ): Promise<TUserLocalAuth | null> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(options);
    const [row] = await executor
      .select()
      .from(userLocalAuthTable)
      .where(and(...where))
      .limit(1)
      .execute();
    return row ?? null;
  }

  async create(
    data: TNewUserLocalAuth,
    tx?: DrizzleTx,
  ): Promise<TUserLocalAuth> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(userLocalAuthTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    data: Partial<TNewUserLocalAuth>,
    options: UserLocalAuthQuery,
    tx?: DrizzleTx,
  ): Promise<TUserLocalAuth[]> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(options);
    return await executor
      .update(userLocalAuthTable)
      .set(data)
      .where(and(...where))
      .returning()
      .execute();
  }
}
