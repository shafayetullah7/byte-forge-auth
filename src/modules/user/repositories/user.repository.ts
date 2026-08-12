import {
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  or,
} from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  ordersTable,
  userLocalAuthTable,
  userTable,
  TNewUser,
  TUser,
} from '@/_db/drizzle/schema';
import { Injectable } from '@nestjs/common';
import type { DrizzleTx } from '@/libs/db/types';
import type { TLockTransaction } from '@/libs/db/types';
import type {
  AdminUserListRow,
  AdminUserProfileRow,
  ListAdminUsersParams,
} from './user.repository.types';

export interface UserQuery {
  id?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
}

export type UserSummary = {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string | null;
};

@Injectable()
export class UserRepository {
  constructor(private readonly db: DrizzleService) {}

  private buildWhere(options?: UserQuery): SQL[] {
    if (!options) return [];

    const where: SQL[] = [];

    if (options.id) where.push(eq(userTable.id, options.id));
    if (options.userName) where.push(eq(userTable.userName, options.userName));
    if (options.firstName)
      where.push(eq(userTable.firstName, options.firstName));
    if (options.lastName) where.push(eq(userTable.lastName, options.lastName));

    return where;
  }

  async findOne(
    options?: UserQuery,
    transaction?: TLockTransaction,
  ): Promise<TUser | null> {
    const executor = this.db.getExecutor(transaction?.tx);
    const where = this.buildWhere(options);

    const baseQuery = executor
      .select()
      .from(userTable)
      .where(and(...where))
      .limit(1);

    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const [row] = await lockQuery.execute();

    return row ?? null;
  }

  async findById(
    id: string,
    transaction?: TLockTransaction,
  ): Promise<TUser | null> {
    return this.findOne({ id }, transaction);
  }

  async findSummariesByIds(ids: string[]): Promise<UserSummary[]> {
    if (ids.length === 0) return [];

    const rows = await this.db.client
      .select({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        userName: userTable.userName,
        email: userLocalAuthTable.email,
      })
      .from(userTable)
      .leftJoin(userLocalAuthTable, eq(userLocalAuthTable.userId, userTable.id))
      .where(inArray(userTable.id, ids));

    return rows.map((row) => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      userName: row.userName,
      email: row.email ?? null,
    }));
  }

  async create(data: TNewUser, tx?: DrizzleTx): Promise<TUser> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor.insert(userTable).values(data).returning();
    return row;
  }

  async update(
    data: Partial<TNewUser>,
    options: UserQuery,
    tx?: DrizzleTx,
  ): Promise<TUser[]> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(options);
    return await executor
      .update(userTable)
      .set(data)
      .where(and(...where))
      .returning()
      .execute();
  }

  async delete(where: SQL, tx?: DrizzleTx): Promise<boolean> {
    const executor = this.db.getExecutor(tx);
    const deleted = await executor
      .delete(userTable)
      .where(where)
      .returning()
      .execute();
    return deleted.length > 0;
  }

  async listForAdmin(
    params: ListAdminUsersParams,
  ): Promise<{ rows: AdminUserListRow[]; total: number }> {
    const { page, limit, sortBy, sortOrder, buyersOnly, search } = params;
    const offset = (page - 1) * limit;
    const isAsc = sortOrder === 'asc';
    const trimmedSearch = search?.trim();

    const conditions = [
      buyersOnly
        ? exists(
            this.db.client
              .select({ id: ordersTable.id })
              .from(ordersTable)
              .where(eq(ordersTable.userId, userTable.id)),
          )
        : undefined,
      trimmedSearch
        ? or(
            ilike(userTable.userName, `%${trimmedSearch}%`),
            ilike(userTable.firstName, `%${trimmedSearch}%`),
            ilike(userTable.lastName, `%${trimmedSearch}%`),
            ilike(userLocalAuthTable.email, `%${trimmedSearch}%`),
          )
        : undefined,
    ].filter(Boolean);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await this.db.client
      .select({ total: count() })
      .from(userTable)
      .leftJoin(userLocalAuthTable, eq(userLocalAuthTable.userId, userTable.id))
      .where(whereClause);

    const rows = await this.db.client
      .select({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        userName: userTable.userName,
        email: userLocalAuthTable.email,
        emailVerified: userTable.emailVerified,
        isActive: userTable.isActive,
        avatar: userTable.avatar,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .leftJoin(userLocalAuthTable, eq(userLocalAuthTable.userId, userTable.id))
      .where(whereClause)
      .orderBy(
        sortBy === 'name'
          ? isAsc
            ? asc(userTable.firstName)
            : desc(userTable.firstName)
          : isAsc
            ? asc(userTable.createdAt)
            : desc(userTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return {
      rows: rows.map((user) => ({
        ...user,
        email: user.email ?? null,
      })),
      total: Number(total ?? 0),
    };
  }

  async findAdminProfile(userId: string): Promise<AdminUserProfileRow | null> {
    const [user] = await this.db.client
      .select({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        userName: userTable.userName,
        email: userLocalAuthTable.email,
        emailVerified: userTable.emailVerified,
        emailVerifiedAt: userTable.emailVerifiedAt,
        isActive: userTable.isActive,
        avatar: userTable.avatar,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
      })
      .from(userTable)
      .leftJoin(userLocalAuthTable, eq(userLocalAuthTable.userId, userTable.id))
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    return {
      ...user,
      email: user.email ?? null,
    };
  }
}
