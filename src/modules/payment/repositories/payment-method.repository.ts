import { Injectable } from '@nestjs/common';
import { SQL, and, count, eq, getTableColumns, ilike, or } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  paymentMethodsTable,
  PaymentMethodWithLogo,
  TNewPaymentMethodRow,
} from '@/_db/drizzle/schema/payment/payment-methods.schema';
import { mediaTable } from '@/_db/drizzle/schema/media/media.schema';
import type { DrizzleTx } from '@/libs/db/types';
import type { TPaymentMethod } from '@/_db/drizzle/enum/payment-method.enum';
import type { PaymentMethodFilters } from './payment-method.repository.types';

@Injectable()
export class PaymentMethodRepository {
  constructor(private readonly db: DrizzleService) {}

  private mapRow(row: {
    paymentMethod: typeof paymentMethodsTable.$inferSelect;
    logoUrl: string | null;
  }): PaymentMethodWithLogo {
    return {
      ...row.paymentMethod,
      logoUrl: row.logoUrl ?? null,
    };
  }

  private buildWhere(filters?: PaymentMethodFilters): SQL[] {
    if (!filters) return [];

    const where: SQL[] = [];

    if (filters.status) {
      where.push(eq(paymentMethodsTable.status, filters.status));
    }

    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push(
        or(
          ilike(paymentMethodsTable.key, term),
          ilike(paymentMethodsTable.displayName, term),
        )!,
      );
    }

    return where;
  }

  private baseSelect(executor: DrizzleTx | DrizzleService['client']) {
    return executor
      .select({
        paymentMethod: getTableColumns(paymentMethodsTable),
        logoUrl: mediaTable.url,
      })
      .from(paymentMethodsTable)
      .leftJoin(mediaTable, eq(paymentMethodsTable.logoId, mediaTable.id));
  }

  async findAll(
    filters?: PaymentMethodFilters,
  ): Promise<PaymentMethodWithLogo[]> {
    const where = this.buildWhere(filters);
    const rows = await this.baseSelect(this.db.client)
      .where(where.length ? and(...where) : undefined)
      .orderBy(paymentMethodsTable.displayName)
      .execute();

    return rows.map((row) => this.mapRow(row));
  }

  async findById(id: string): Promise<PaymentMethodWithLogo | null> {
    const [row] = await this.baseSelect(this.db.client)
      .where(eq(paymentMethodsTable.id, id))
      .limit(1)
      .execute();

    return row ? this.mapRow(row) : null;
  }

  async findByKey(key: TPaymentMethod): Promise<PaymentMethodWithLogo | null> {
    const [row] = await this.baseSelect(this.db.client)
      .where(eq(paymentMethodsTable.key, key))
      .limit(1)
      .execute();

    return row ? this.mapRow(row) : null;
  }

  async findActiveByKey(
    key: TPaymentMethod,
  ): Promise<PaymentMethodWithLogo | null> {
    const [row] = await this.baseSelect(this.db.client)
      .where(
        and(
          eq(paymentMethodsTable.key, key),
          eq(paymentMethodsTable.status, 'ACTIVE'),
        ),
      )
      .limit(1)
      .execute();

    return row ? this.mapRow(row) : null;
  }

  async create(
    data: TNewPaymentMethodRow,
    tx?: DrizzleTx,
  ): Promise<PaymentMethodWithLogo> {
    const executor = tx ?? this.db.client;
    const [row] = await executor
      .insert(paymentMethodsTable)
      .values(data)
      .returning()
      .execute();

    const [created] = await this.baseSelect(executor)
      .where(eq(paymentMethodsTable.id, row.id))
      .limit(1)
      .execute();

    if (!created) {
      throw new Error(`Payment method '${row.id}' not found after create`);
    }

    return this.mapRow(created);
  }

  async update(
    id: string,
    data: Partial<
      Pick<
        typeof paymentMethodsTable.$inferInsert,
        'displayName' | 'logoId' | 'description'
      >
    >,
    tx?: DrizzleTx,
  ): Promise<PaymentMethodWithLogo | null> {
    const executor = tx ?? this.db.client;
    const [row] = await executor
      .update(paymentMethodsTable)
      .set(data)
      .where(eq(paymentMethodsTable.id, id))
      .returning()
      .execute();

    if (!row) return null;

    if (tx) {
      const [updated] = await this.baseSelect(tx)
        .where(eq(paymentMethodsTable.id, id))
        .limit(1)
        .execute();
      return updated ? this.mapRow(updated) : null;
    }

    return this.findById(id);
  }

  async countActive(tx?: DrizzleTx): Promise<number> {
    const executor = tx ?? this.db.client;
    const [result] = await executor
      .select({ value: count() })
      .from(paymentMethodsTable)
      .where(eq(paymentMethodsTable.status, 'ACTIVE'))
      .execute();

    return Number(result?.value ?? 0);
  }

  async setStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
    tx?: DrizzleTx,
  ): Promise<PaymentMethodWithLogo | null> {
    const executor = tx ?? this.db.client;
    const [row] = await executor
      .update(paymentMethodsTable)
      .set({ status })
      .where(eq(paymentMethodsTable.id, id))
      .returning()
      .execute();

    if (!row) return null;

    if (tx) {
      const [updated] = await this.baseSelect(tx)
        .where(eq(paymentMethodsTable.id, id))
        .limit(1)
        .execute();
      return updated ? this.mapRow(updated) : null;
    }

    return this.findById(id);
  }
}
