import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionIntervalEnum } from '@/_db/drizzle/enum/subscription-interval.enum';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { StripeSubscriptionProvider } from '../../../../infrastructure/providers/stripe-subscription.provider';
import { ShopSubscriptionRepository } from '../../../../repositories/shop-subscription.repository';
import { SubscriptionInvoiceRepository } from '../../../../repositories/subscription-invoice.repository';
import { SubscriptionPlanRepository } from '../../../../repositories/subscription-plan.repository';
import { CreateSellerSubscriptionCheckoutCommand } from '../../create-seller-subscription-checkout.command';

describe('CreateSellerSubscriptionCheckoutCommand', () => {
  const shopId = '11111111-1111-4111-8111-111111111111';
  const userId = '22222222-2222-4222-8222-222222222222';
  const planId = '33333333-3333-4333-8333-333333333333';

  const plan = {
    id: planId,
    name: 'Monthly',
    description: null,
    interval: SubscriptionIntervalEnum.MONTH,
    priceBdt: '499.00',
    isActiveForNew: true,
    isRetired: false,
    stripeProductId: 'prod_1',
    stripePriceId: 'price_1',
    previousStripePriceIds: [],
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let db: {
    transaction: jest.Mock;
    client: { select: jest.Mock };
  };
  let shopSubscriptionRepository: {
    acquireShopLock: jest.Mock;
    findByShopId: jest.Mock;
  };
  let subscriptionPlanRepository: { findById: jest.Mock };
  let subscriptionInvoiceRepository: {
    findLatestPendingStripeCheckout: jest.Mock;
    create: jest.Mock;
  };
  let stripeSubscriptionProvider: {
    createSubscriptionCheckoutSession: jest.Mock;
    retrieveCheckoutSession: jest.Mock;
    retrieveSubscription: jest.Mock;
  };
  let command: CreateSellerSubscriptionCheckoutCommand;

  beforeEach(() => {
    db = {
      transaction: jest.fn(async (callback) => callback({})),
      client: {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                execute: jest
                  .fn()
                  .mockResolvedValue([{ email: 'seller@example.com' }]),
              }),
            }),
          }),
        }),
      },
    };

    shopSubscriptionRepository = {
      acquireShopLock: jest.fn().mockResolvedValue(undefined),
      findByShopId: jest.fn().mockResolvedValue(null),
    };

    subscriptionPlanRepository = {
      findById: jest.fn().mockResolvedValue(plan),
    };

    subscriptionInvoiceRepository = {
      findLatestPendingStripeCheckout: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'invoice-1' }),
    };

    stripeSubscriptionProvider = {
      createSubscriptionCheckoutSession: jest.fn().mockResolvedValue({
        url: 'https://checkout.stripe.com/c/pay/cs_test_123',
        sessionId: 'cs_test_123',
      }),
      retrieveCheckoutSession: jest.fn(),
      retrieveSubscription: jest.fn(),
    };

    command = new CreateSellerSubscriptionCheckoutCommand(
      db as unknown as DrizzleService,
      shopSubscriptionRepository as unknown as ShopSubscriptionRepository,
      subscriptionPlanRepository as unknown as SubscriptionPlanRepository,
      subscriptionInvoiceRepository as unknown as SubscriptionInvoiceRepository,
      stripeSubscriptionProvider as unknown as StripeSubscriptionProvider,
    );
  });

  it('creates a Stripe checkout session under shop lock', async () => {
    const result = await command.execute(shopId, userId, { planId });

    expect(shopSubscriptionRepository.acquireShopLock).toHaveBeenCalledWith(
      shopId,
      expect.anything(),
    );
    expect(
      stripeSubscriptionProvider.createSubscriptionCheckoutSession,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId,
        planId,
        stripePriceId: 'price_1',
        customerEmail: 'seller@example.com',
      }),
    );
    expect(subscriptionInvoiceRepository.create).toHaveBeenCalled();
    expect(result.url).toContain('checkout.stripe.com');
    expect(result.sessionId).toBe('cs_test_123');
  });

  it('returns existing open checkout session when one is pending', async () => {
    const now = new Date();
    subscriptionInvoiceRepository.findLatestPendingStripeCheckout.mockResolvedValue(
      {
        externalId: 'cs_test_existing',
        createdAt: now,
        metadata: { planId },
      },
    );
    stripeSubscriptionProvider.retrieveCheckoutSession.mockResolvedValue({
      id: 'cs_test_existing',
      status: 'open',
      url: 'https://checkout.stripe.com/c/pay/cs_test_existing',
    });

    const result = await command.execute(shopId, userId, { planId });

    expect(
      stripeSubscriptionProvider.createSubscriptionCheckoutSession,
    ).not.toHaveBeenCalled();
    expect(result.sessionId).toBe('cs_test_existing');
  });

  it('rejects retired or unsynced plans', async () => {
    subscriptionPlanRepository.findById.mockResolvedValue({
      ...plan,
      isRetired: true,
    });

    await expect(
      command.execute(shopId, userId, { planId }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects checkout while subscription is active', async () => {
    shopSubscriptionRepository.findByShopId.mockResolvedValue({
      currentPeriodEnd: new Date('2026-12-01T00:00:00.000Z'),
    });

    await expect(
      command.execute(shopId, userId, { planId }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when plan is missing', async () => {
    subscriptionPlanRepository.findById.mockResolvedValue(null);

    await expect(
      command.execute(shopId, userId, { planId }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
