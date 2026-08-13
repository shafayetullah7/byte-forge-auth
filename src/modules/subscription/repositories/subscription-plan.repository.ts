import { Injectable } from '@nestjs/common';
import { SQL, and, asc, eq, ilike } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  subscriptionPlansTable,
  type TNewSubscriptionPlan,
  type TSubscriptionPlan,
} from '@/_db/drizzle/schema/subscription/subscription-plans.schema';
import type { DrizzleTx } from '@/libs/db/types';
import type {
  SubscriptionPlanFilters,
  SubscriptionPlanUpdateInput,
} from './subscription-plan.repository.types';

@Injectable()
export class SubscriptionPlanRepository {
  constructor(private readonly db: DrizzleService) {}

  private buildWhere(filters?: SubscriptionPlanFilters): SQL[] {
    if (!filters) return [];

    const where: SQL[] = [];

    if (filters.activeForNewOnly) {
      where.push(eq(subscriptionPlansTable.isActiveForNew, true));
      where.push(eq(subscriptionPlansTable.isRetired, false));
    } else if (filters.includeRetired === false) {
      where.push(eq(subscriptionPlansTable.isRetired, false));
    }

    if (filters.search?.trim()) {
      where.push(
        ilike(subscriptionPlansTable.name, `%${filters.search.trim()}%`),
      );
    }

    return where;
  }

  async findAll(
    filters?: SubscriptionPlanFilters,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionPlan[]> {
    const executor = this.db.getExecutor(tx);
    const where = this.buildWhere(filters);

    return executor
      .select()
      .from(subscriptionPlansTable)
      .where(where.length ? and(...where) : undefined)
      .orderBy(
        asc(subscriptionPlansTable.sortOrder),
        asc(subscriptionPlansTable.createdAt),
      )
      .execute();
  }

  async findById(
    id: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionPlan | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.id, id))
      .limit(1)
      .execute();

    return row ?? null;
  }

  async create(
    data: TNewSubscriptionPlan,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionPlan> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(subscriptionPlansTable)
      .values(data)
      .returning()
      .execute();

    return row;
  }

  async update(
    id: string,
    data: SubscriptionPlanUpdateInput,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionPlan | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .update(subscriptionPlansTable)
      .set(data)
      .where(eq(subscriptionPlansTable.id, id))
      .returning()
      .execute();

    return row ?? null;
  }

  async retire(id: string, tx?: DrizzleTx): Promise<TSubscriptionPlan | null> {
    return this.update(
      id,
      { isActiveForNew: false, isRetired: true },
      tx,
    );
  }

  async appendPreviousStripePriceId(
    id: string,
    stripePriceId: string,
    tx?: DrizzleTx,
  ): Promise<TSubscriptionPlan | null> {
    const plan = await this.findById(id, tx);
    if (!plan) return null;

    const previous = plan.previousStripePriceIds ?? [];
    if (previous.includes(stripePriceId)) {
      return plan;
    }

    return this.update(
      id,
      { previousStripePriceIds: [...previous, stripePriceId] },
      tx,
    );
  }
}
