import { SubscriptionIntervalEnum } from '@/_db/drizzle/enum/subscription-interval.enum';
import type { TSubscriptionPlan } from '@/_db/drizzle/schema/subscription/subscription-plans.schema';
import type Stripe from 'stripe';
import { bdtDecimalToStripeUnitAmount } from '@/libs/gateways/stripe/stripe-amount.util';

export type StripeRecurringInterval = 'month' | 'year';

export function mapPlanIntervalToStripe(
  interval: TSubscriptionPlan['interval'],
): StripeRecurringInterval {
  return interval === SubscriptionIntervalEnum.YEAR ? 'year' : 'month';
}

export function stripePriceMatchesPlan(
  price: Stripe.Price,
  plan: TSubscriptionPlan,
): boolean {
  if (!price.active || !price.recurring) {
    return false;
  }

  const expectedAmount = bdtDecimalToStripeUnitAmount(plan.priceBdt);
  const expectedInterval = mapPlanIntervalToStripe(plan.interval);

  return (
    price.currency === 'bdt' &&
    price.unit_amount === expectedAmount &&
    price.recurring.interval === expectedInterval
  );
}
