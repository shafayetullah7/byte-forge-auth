import { SubscriptionIntervalEnum } from '@/_db/drizzle/enum/subscription-interval.enum';
import type { TSubscriptionPlan } from '@/_db/drizzle/schema/subscription/subscription-plans.schema';

export type SubscriptionPlanResponse = {
  id: string;
  name: string;
  description: string | null;
  interval: string;
  priceBdt: string;
  isActiveForNew: boolean;
  isRetired: boolean;
  stripeProductId: string | null;
  stripePriceId: string | null;
  previousStripePriceIds: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export function toSubscriptionPlanResponse(
  row: TSubscriptionPlan,
): SubscriptionPlanResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    interval: row.interval,
    priceBdt: row.priceBdt,
    isActiveForNew: row.isActiveForNew,
    isRetired: row.isRetired,
    stripeProductId: row.stripeProductId ?? null,
    stripePriceId: row.stripePriceId ?? null,
    previousStripePriceIds: row.previousStripePriceIds ?? [],
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const SUBSCRIPTION_PLAN_INTERVALS = Object.values(
  SubscriptionIntervalEnum,
);
