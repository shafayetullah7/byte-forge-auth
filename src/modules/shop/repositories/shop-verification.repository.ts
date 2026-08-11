import { SQL, eq, and } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  shopVerificationStatusEnum,
  shopVerificationTable,
  TShopVerification,
  TNewShopVerification,
} from '@/_db/drizzle/schema';
import type { DrizzleTx } from '@/libs/db/types';

export interface ShopVerificationQuery {
  id?: string;
  shopId?: string;
  status?: (typeof shopVerificationStatusEnum.enumValues)[number];
}

@Injectable()
export class ShopVerificationRepository {
  constructor(private readonly db: DrizzleService) {}

  private buildWhere(options?: ShopVerificationQuery): SQL[] {
    if (!options) return [];

    const where: SQL[] = [];

    if (options.id) where.push(eq(shopVerificationTable.id, options.id));
    if (options.shopId)
      where.push(eq(shopVerificationTable.shopId, options.shopId));
    if (options.status)
      where.push(eq(shopVerificationTable.status, options.status));

    return where;
  }

  async findOne(
    options?: ShopVerificationQuery,
    tx?: DrizzleTx,
  ): Promise<TShopVerification | null> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(options);
    const [row] = await executor
      .select()
      .from(shopVerificationTable)
      .where(and(...where))
      .limit(1)
      .execute();
    return row ?? null;
  }

  async create(
    data: TNewShopVerification,
    tx?: DrizzleTx,
  ): Promise<TShopVerification> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(shopVerificationTable)
      .values(data)
      .returning();
    return row;
  }

  async update(
    data: Partial<TNewShopVerification>,
    options: ShopVerificationQuery,
    tx?: DrizzleTx,
  ): Promise<TShopVerification[]> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(options);
    return await executor
      .update(shopVerificationTable)
      .set(data)
      .where(and(...where))
      .returning()
      .execute();
  }
}
