import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionStatusEnum } from '@/_db/drizzle/enum/subscription-status.enum';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { SubscriptionStatus } from '../../domain/subscription-status';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';
import { CheckSellerSubscriptionQuery } from './check-seller-subscription.query';

describe('CheckSellerSubscriptionQuery', () => {
  const shopId = 'shop-1';
  const futureEnd = new Date('2026-12-01T00:00:00.000Z');
  const pastEnd = new Date('2026-01-01T00:00:00.000Z');
  const now = new Date('2026-06-01T00:00:00.000Z');

  let repository: jest.Mocked<Pick<ShopSubscriptionRepository, 'findByShopId'>>;
  let appConfig: { subscriptionEnforcementEnabled: boolean };
  let query: CheckSellerSubscriptionQuery;

  beforeEach(() => {
    repository = {
      findByShopId: jest.fn(),
    };
    appConfig = { subscriptionEnforcementEnabled: false };
    query = new CheckSellerSubscriptionQuery(
      repository as unknown as ShopSubscriptionRepository,
      appConfig as unknown as AppConfigService,
    );
  });

  it('returns inactive NONE when no row and enforcement is on', async () => {
    appConfig.subscriptionEnforcementEnabled = true;
    repository.findByShopId.mockResolvedValue(null);

    const result = await query.execute(shopId, now);

    expect(result).toEqual({
      active: false,
      status: SubscriptionStatus.NONE,
      currentPeriodEnd: null,
      billingProvider: SubscriptionBillingProviderEnum.NONE,
    });
  });

  it('returns active when no row and enforcement is off', async () => {
    repository.findByShopId.mockResolvedValue(null);

    const result = await query.execute(shopId, now);

    expect(result.active).toBe(true);
    expect(result.status).toBe(SubscriptionStatus.NONE);
  });

  it('returns active ACTIVE when period is valid and enforcement is on', async () => {
    appConfig.subscriptionEnforcementEnabled = true;
    repository.findByShopId.mockResolvedValue({
      shopId,
      status: SubscriptionStatusEnum.ACTIVE,
      currentPeriodEnd: futureEnd,
      billingProvider: SubscriptionBillingProviderEnum.STRIPE,
    } as Awaited<ReturnType<ShopSubscriptionRepository['findByShopId']>>);

    const result = await query.execute(shopId, now);

    expect(result.active).toBe(true);
    expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    expect(result.currentPeriodEnd).toEqual(futureEnd);
  });

  it('returns inactive EXPIRED when period ended and enforcement is on', async () => {
    appConfig.subscriptionEnforcementEnabled = true;
    repository.findByShopId.mockResolvedValue({
      shopId,
      status: SubscriptionStatusEnum.EXPIRED,
      currentPeriodEnd: pastEnd,
      billingProvider: SubscriptionBillingProviderEnum.COUPON,
    } as Awaited<ReturnType<ShopSubscriptionRepository['findByShopId']>>);

    const result = await query.execute(shopId, now);

    expect(result.active).toBe(false);
    expect(result.status).toBe(SubscriptionStatus.EXPIRED);
  });

  it('returns active true when expired but enforcement is off', async () => {
    repository.findByShopId.mockResolvedValue({
      shopId,
      status: SubscriptionStatusEnum.EXPIRED,
      currentPeriodEnd: pastEnd,
      billingProvider: SubscriptionBillingProviderEnum.COUPON,
    } as Awaited<ReturnType<ShopSubscriptionRepository['findByShopId']>>);

    const result = await query.execute(shopId, now);

    expect(result.active).toBe(true);
    expect(result.status).toBe(SubscriptionStatus.EXPIRED);
  });
});
