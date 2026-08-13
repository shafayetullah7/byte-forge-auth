import type { TSubscriptionBillingProvider } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import type { SubscriptionStatus } from '../domain/subscription-status';

export type SellerSubscriptionEntitlement = {
  /** Whether commercial actions (publish, orders) are allowed. */
  active: boolean;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  billingProvider: TSubscriptionBillingProvider;
};
