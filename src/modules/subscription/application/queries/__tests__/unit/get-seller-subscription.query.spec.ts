import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionStatusEnum } from '@/_db/drizzle/enum/subscription-status.enum';
import { SubscriptionIntervalEnum } from '@/_db/drizzle/enum/subscription-interval.enum';
import { SubscriptionStatus } from '../../../../domain/subscription-status';
import { ShopSubscriptionRepository } from '../../../../repositories/shop-subscription.repository';
import { SubscriptionPlanRepository } from '../../../../repositories/subscription-plan.repository';
import { GetSellerSubscriptionQuery } from '../../get-seller-subscription.query';

describe('GetSellerSubscriptionQuery', () => {
  const shopId = 'shop-1';
  const now = new Date('2026-06-01T00:00:00.000Z');
  const futureEnd = new Date('2026-12-01T00:00:00.000Z');
  const pastEnd = new Date('2026-01-01T00:00:00.000Z');

  let shopSubscriptionRepository: jest.Mocked<
    Pick<ShopSubscriptionRepository, 'findByShopId'>
  >;
  let subscriptionPlanRepository: jest.Mocked<
    Pick<SubscriptionPlanRepository, 'findAll'>
  >;
  let query: GetSellerSubscriptionQuery;

  beforeEach(() => {
    shopSubscriptionRepository = {
      findByShopId: jest.fn(),
    };
    subscriptionPlanRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'plan-1',
          name: 'Monthly',
          description: null,
          interval: SubscriptionIntervalEnum.MONTH,
          priceBdt: '500.00',
          isActiveForNew: true,
          isRetired: false,
          stripeProductId: null,
          stripePriceId: null,
          previousStripePriceIds: [],
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]),
    };
    query = new GetSellerSubscriptionQuery(
      shopSubscriptionRepository as unknown as ShopSubscriptionRepository,
      subscriptionPlanRepository as unknown as SubscriptionPlanRepository,
    );
  });

  it('returns NONE with available plans when shop has no subscription row', async () => {
    shopSubscriptionRepository.findByShopId.mockResolvedValue(null);

    const result = await query.execute(shopId, now);

    expect(result.status).toBe(SubscriptionStatus.NONE);
    expect(result.active).toBe(false);
    expect(result.currentPeriodEnd).toBeNull();
    expect(result.availablePlans).toHaveLength(1);
    expect(subscriptionPlanRepository.findAll).toHaveBeenCalledWith({
      activeForNewOnly: true,
    });
  });

  it('returns ACTIVE when period is in the future', async () => {
    shopSubscriptionRepository.findByShopId.mockResolvedValue({
      shopId,
      status: SubscriptionStatusEnum.ACTIVE,
      currentPeriodEnd: futureEnd,
      billingProvider: SubscriptionBillingProviderEnum.STRIPE,
      cancelAtPeriodEnd: false,
    } as Awaited<ReturnType<ShopSubscriptionRepository['findByShopId']>>);

    const result = await query.execute(shopId, now);

    expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    expect(result.active).toBe(true);
    expect(result.currentPeriodEnd).toBe(futureEnd.toISOString());
    expect(result.billingProvider).toBe(SubscriptionBillingProviderEnum.STRIPE);
  });

  it('returns EXPIRED when period ended regardless of enforcement flag', async () => {
    shopSubscriptionRepository.findByShopId.mockResolvedValue({
      shopId,
      status: SubscriptionStatusEnum.EXPIRED,
      currentPeriodEnd: pastEnd,
      billingProvider: SubscriptionBillingProviderEnum.COUPON,
      cancelAtPeriodEnd: false,
    } as Awaited<ReturnType<ShopSubscriptionRepository['findByShopId']>>);

    const result = await query.execute(shopId, now);

    expect(result.status).toBe(SubscriptionStatus.EXPIRED);
    expect(result.active).toBe(false);
  });
});
