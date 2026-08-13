import { Injectable } from '@nestjs/common';
import { SQL, and, count, desc, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionInvoiceStatusEnum } from '@/_db/drizzle/enum/subscription-invoice-status.enum';
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

  async findLatestPendingStripeCheckout(
    shopId: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionInvoice | null> {
    const rows = await this.findByShopId(
      {
        shopId,
        status: SubscriptionInvoiceStatusEnum.PENDING,
        provider: SubscriptionBillingProviderEnum.STRIPE,
        limit: 1,
      },
      tx,
    );

    return rows[0] ?? null;
  }

  async listByShopIdPaginated(
    shopId: string,
    page: number,
    limit: number,
    tx?: DrizzleTx,
  ): Promise<{ rows: TSubscriptionInvoice[]; total: number }> {
    const executor = this.db.getExecutor(tx);
    const where = eq(subscriptionInvoicesTable.shopId, shopId);
    const offset = (page - 1) * limit;

    const [rows, totalResult] = await Promise.all([
      executor
        .select()
        .from(subscriptionInvoicesTable)
        .where(where)
        .orderBy(desc(subscriptionInvoicesTable.createdAt))
        .limit(limit)
        .offset(offset)
        .execute(),
      executor
        .select({ total: count() })
        .from(subscriptionInvoicesTable)
        .where(where)
        .execute(),
    ]);

    return {
      rows,
      total: totalResult[0]?.total ?? 0,
    };
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
