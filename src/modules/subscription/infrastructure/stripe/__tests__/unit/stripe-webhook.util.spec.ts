import {
  mapStripeSubscriptionToUpsert,
  stripeUnixToDate,
  isSubscriptionStripeMetadata,
} from '../../../../infrastructure/stripe/stripe-webhook.util';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionStatus } from '../../../../domain/subscription-status';

describe('stripe-webhook.util', () => {
  it('detects subscription domain metadata', () => {
    expect(isSubscriptionStripeMetadata({ domain: 'subscription' })).toBe(true);
    expect(isSubscriptionStripeMetadata({ domain: 'order' })).toBe(false);
  });

  it('maps Stripe subscription period to shop upsert input', () => {
    const upsert = mapStripeSubscriptionToUpsert(
      {
        id: 'sub_123',
        customer: 'cus_123',
        cancel_at_period_end: true,
        metadata: { domain: 'subscription', shopId: 'shop-1', planId: 'plan-1' },
        items: {
          data: [
            {
              current_period_end: 1_893_456_000,
              current_period_start: 1_892_803_200,
            },
          ],
        },
      } as never,
      'plan-1',
    );

    expect(upsert.billingProvider).toBe(SubscriptionBillingProviderEnum.STRIPE);
    expect(upsert.stripeSubscriptionId).toBe('sub_123');
    expect(upsert.cancelAtPeriodEnd).toBe(true);
    expect(upsert.status).toBe(SubscriptionStatus.ACTIVE);
    expect(upsert.currentPeriodEnd).toEqual(stripeUnixToDate(1_893_456_000));
  });
});
