import { SQL, and, count, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  TNewUserAddress,
  TUserAddress,
  userAddressesTable,
} from '@/_db/drizzle/schema';
import { Injectable } from '@nestjs/common';
import type { DrizzleTx, TLockTransaction } from '@/libs/db/types';

export interface UserAddressQuery {
  id?: string;
  userId?: string;
  type?: 'shipping' | 'billing' | 'both';
  isDefault?: boolean;
}

@Injectable()
export class UserAddressRepository {
  constructor(private readonly db: DrizzleService) {}

  private buildWhere(options?: UserAddressQuery): SQL[] {
    if (!options) return [];

    const where: SQL[] = [];

    if (options.id) where.push(eq(userAddressesTable.id, options.id));
    if (options.userId)
      where.push(eq(userAddressesTable.userId, options.userId));
    if (options.type) where.push(eq(userAddressesTable.type, options.type));
    if (options.isDefault !== undefined)
      where.push(eq(userAddressesTable.isDefault, options.isDefault));

    return where;
  }

  async findOne(
    options?: UserAddressQuery,
    transaction?: TLockTransaction,
  ): Promise<TUserAddress | null> {
    const executor = this.db.getExecutor(transaction?.tx);
    const where = this.buildWhere(options);

    const baseQuery = executor
      .select()
      .from(userAddressesTable)
      .where(and(...where))
      .limit(1);

    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const [row] = await lockQuery.execute();

    return row ?? null;
  }

  async findById(
    id: string,
    transaction?: TLockTransaction,
  ): Promise<TUserAddress | null> {
    return this.findOne({ id }, transaction);
  }

  async findMany(options?: UserAddressQuery): Promise<TUserAddress[]> {
    const executor = this.db.getExecutor();
    const where = this.buildWhere(options);

    return executor
      .select()
      .from(userAddressesTable)
      .where(and(...where))
      .orderBy(userAddressesTable.createdAt)
      .execute();
  }

  async findDefault(
    userId: string,
    type: 'shipping' | 'billing' | 'both',
  ): Promise<TUserAddress | null> {
    return this.findOne({ userId, type, isDefault: true });
  }

  async countByUserId(userId: string): Promise<number> {
    const executor = this.db.getExecutor();
    const [result] = await executor
      .select({ count: count(userAddressesTable.id) })
      .from(userAddressesTable)
      .where(eq(userAddressesTable.userId, userId));
    return Number(result?.count ?? 0);
  }

  async create(data: TNewUserAddress, tx?: DrizzleTx): Promise<TUserAddress> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(userAddressesTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    data: Partial<TNewUserAddress>,
    options: UserAddressQuery,
    tx?: DrizzleTx,
  ): Promise<TUserAddress[]> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(options);

    return executor
      .update(userAddressesTable)
      .set(data)
      .where(and(...where))
      .returning()
      .execute();
  }

  async delete(where: SQL, tx?: DrizzleTx): Promise<boolean> {
    const executor = this.db.getExecutor(tx);
    const deleted = await executor
      .delete(userAddressesTable)
      .where(where)
      .returning()
      .execute();
    return deleted.length > 0;
  }
}
