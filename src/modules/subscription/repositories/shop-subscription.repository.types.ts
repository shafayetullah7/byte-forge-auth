import type { TSubscriptionBillingProvider } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import type { TSubscriptionStatus } from '@/_db/drizzle/enum/subscription-status.enum';

export type ShopSubscriptionUpsertInput = {
  status: TSubscriptionStatus;
  currentPeriodEnd: Date | null;
  billingProvider: TSubscriptionBillingProvider;
  planId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean;
};

export type ShopSubscriptionUpdateInput = Partial<ShopSubscriptionUpsertInput>;
