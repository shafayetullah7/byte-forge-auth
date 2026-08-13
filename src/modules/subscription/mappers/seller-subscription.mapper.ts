import type { TShopSubscription } from '@/_db/drizzle/schema/subscription/shop-subscriptions.schema';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import {
  computeStatus,
  isEntitlementActive,
  SubscriptionStatus,
} from '../domain';
import {
  toSubscriptionPlanResponse,
  type SubscriptionPlanResponse,
} from './subscription-plan.mapper';

export type SellerSubscriptionResponse = {
  status: string;
  active: boolean;
  currentPeriodEnd: string | null;
  billingProvider: string;
  cancelAtPeriodEnd: boolean;
  availablePlans: SubscriptionPlanResponse[];
};

export function toSellerSubscriptionResponse(
  subscription: TShopSubscription | null,
  availablePlans: SubscriptionPlanResponse[],
  now: Date = new Date(),
): SellerSubscriptionResponse {
  if (!subscription) {
    return {
      status: SubscriptionStatus.NONE,
      active: false,
      currentPeriodEnd: null,
      billingProvider: SubscriptionBillingProviderEnum.NONE,
      cancelAtPeriodEnd: false,
      availablePlans,
    };
  }

  return {
    status: computeStatus(subscription.currentPeriodEnd, now),
    active: isEntitlementActive(subscription.currentPeriodEnd, now),
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    billingProvider: subscription.billingProvider,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    availablePlans,
  };
}
