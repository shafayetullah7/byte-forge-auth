import { Injectable } from '@nestjs/common';
import { SQL, and, desc, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  subscriptionInvoicesTable,
  type TNewSubscriptionInvoice,
  type TSubscriptionInvoice,
} from '@/_db/drizzle/schema/subscription/subscription-invoices.schema';
import type { DrizzleTx } from '@/libs/db/types';
import type {
  SubscriptionInvoiceFilters,
  SubscriptionInvoiceProvider,
  SubscriptionInvoiceUpdateInput,
} from './subscription-invoice.repository.types';

@Injectable()
export class SubscriptionInvoiceRepository {
  constructor(private readonly db: DrizzleService) {}

  async create(
    data: TNewSubscriptionInvoice,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionInvoice> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(subscriptionInvoicesTable)
      .values(data)
      .returning()
      .execute();

    return row;
  }

  async findById(
    id: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionInvoice | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(subscriptionInvoicesTable)
      .where(eq(subscriptionInvoicesTable.id, id))
      .limit(1)
      .execute();

    return row ?? null;
  }

  async findByProviderAndExternalId(
    provider: SubscriptionInvoiceProvider,
    externalId: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionInvoice | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(subscriptionInvoicesTable)
      .where(
        and(
          eq(subscriptionInvoicesTable.provider, provider),
          eq(subscriptionInvoicesTable.externalId, externalId),
        ),
      )
      .limit(1)
      .execute();

    return row ?? null;
  }

  async findByShopId(
    filters: SubscriptionInvoiceFilters,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionInvoice[]> {
    const executor = this.db.getExecutor(tx);
    const where: SQL[] = [eq(subscriptionInvoicesTable.shopId, filters.shopId)];

    if (filters.status) {
      where.push(eq(subscriptionInvoicesTable.status, filters.status));
    }
    if (filters.provider) {
      where.push(eq(subscriptionInvoicesTable.provider, filters.provider));
    }

    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    return executor
      .select()
      .from(subscriptionInvoicesTable)
      .where(and(...where))
      .orderBy(desc(subscriptionInvoicesTable.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();
  }

  async update(
    id: string,
    data: SubscriptionInvoiceUpdateInput,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionInvoice | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .update(subscriptionInvoicesTable)
      .set(data)
      .where(eq(subscriptionInvoicesTable.id, id))
      .returning()
      .execute();

    return row ?? null;
  }
}
