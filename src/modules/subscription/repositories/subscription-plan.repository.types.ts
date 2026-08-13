import type { TSubscriptionInterval } from '@/_db/drizzle/enum/subscription-interval.enum';

export type SubscriptionPlanFilters = {
  /** When true, only plans available for new seller purchases. */
  activeForNewOnly?: boolean;
  /** When false, excludes retired plans. Default: include all. */
  includeRetired?: boolean;
  search?: string;
};

export type SubscriptionPlanUpdateInput = Partial<{
  name: string;
  description: string | null;
  interval: TSubscriptionInterval;
  priceBdt: string;
  isActiveForNew: boolean;
  isRetired: boolean;
  stripeProductId: string | null;
  stripePriceId: string | null;
  previousStripePriceIds: string[];
  sortOrder: number;
}>;
