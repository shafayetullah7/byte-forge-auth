import { BadRequestException } from '@nestjs/common';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { StripeSubscriptionProvider } from '../../../../infrastructure/providers/stripe-subscription.provider';
import { ShopSubscriptionRepository } from '../../../../repositories/shop-subscription.repository';
import { CreateSellerBillingPortalSessionCommand } from '../../create-seller-billing-portal-session.command';

describe('CreateSellerBillingPortalSessionCommand', () => {
  const shopId = '11111111-1111-4111-8111-111111111111';

  let shopSubscriptionRepository: { findByShopId: jest.Mock };
  let stripeSubscriptionProvider: { createBillingPortalSession: jest.Mock };
  let command: CreateSellerBillingPortalSessionCommand;

  beforeEach(() => {
    shopSubscriptionRepository = {
      findByShopId: jest.fn(),
    };
    stripeSubscriptionProvider = {
      createBillingPortalSession: jest.fn().mockResolvedValue({
        url: 'https://billing.stripe.com/session/test_123',
      }),
    };
    command = new CreateSellerBillingPortalSessionCommand(
      shopSubscriptionRepository as unknown as ShopSubscriptionRepository,
      stripeSubscriptionProvider as unknown as StripeSubscriptionProvider,
    );
  });

  it('creates a billing portal session for Stripe customers', async () => {
    shopSubscriptionRepository.findByShopId.mockResolvedValue({
      shopId,
      stripeCustomerId: 'cus_123',
      billingProvider: SubscriptionBillingProviderEnum.STRIPE,
    });

    const result = await command.execute(shopId);

    expect(
      stripeSubscriptionProvider.createBillingPortalSession,
    ).toHaveBeenCalledWith('cus_123');
    expect(result.url).toContain('billing.stripe.com');
  });

  it('rejects coupon-only shops with a helpful message', async () => {
    shopSubscriptionRepository.findByShopId.mockResolvedValue({
      shopId,
      stripeCustomerId: null,
      billingProvider: SubscriptionBillingProviderEnum.COUPON,
    });

    await expect(command.execute(shopId)).rejects.toThrow(BadRequestException);
    await expect(command.execute(shopId)).rejects.toThrow(/coupon plan/i);
  });

  it('rejects shops without a Stripe customer', async () => {
    shopSubscriptionRepository.findByShopId.mockResolvedValue(null);

    await expect(command.execute(shopId)).rejects.toThrow(BadRequestException);
    await expect(command.execute(shopId)).rejects.toThrow(
      /Subscribe via Stripe checkout first/,
    );
  });
});
