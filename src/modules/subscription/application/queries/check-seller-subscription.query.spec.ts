import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionStatusEnum } from '@/_db/drizzle/enum/subscription-status.enum';
import { SubscriptionStatus } from '../../domain/subscription-status';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';
import { CheckSellerSubscriptionQuery } from './check-seller-subscription.query';

describe('CheckSellerSubscriptionQuery', () => {
  const shopId = 'shop-1';
  const shopId2 = 'shop-2';
  const futureEnd = new Date('2026-12-01T00:00:00.000Z');
  const pastEnd = new Date('2026-01-01T00:00:00.000Z');
  const now = new Date('2026-06-01T00:00:00.000Z');

  let repository: jest.Mocked<
    Pick<ShopSubscriptionRepository, 'findByShopId' | 'findByShopIds'>
  >;
  let db: { client: { select: jest.Mock } };
  let query: CheckSellerSubscriptionQuery;

  beforeEach(() => {
    repository = {
      findByShopId: jest.fn(),
      findByShopIds: jest.fn(),
    };
    db = {
      client: {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue('entitlement-exists'),
          }),
        }),
      },
    };
    query = new CheckSellerSubscriptionQuery(
      repository as unknown as ShopSubscriptionRepository,
      db as never,
    );
  });

  it('returns inactive NONE when no row', async () => {
    repository.findByShopId.mockResolvedValue(null);

    const result = await query.execute(shopId, now);

    expect(result).toEqual({
      active: false,
      status: SubscriptionStatus.NONE,
      currentPeriodEnd: null,
      billingProvider: SubscriptionBillingProviderEnum.NONE,
    });
  });

  it('returns active ACTIVE when period is valid', async () => {
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

  it('returns inactive EXPIRED when period ended', async () => {
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

  it('executeMany batch-loads entitlements', async () => {
    repository.findByShopIds.mockResolvedValue([
      {
        shopId,
        status: SubscriptionStatusEnum.ACTIVE,
        currentPeriodEnd: futureEnd,
        billingProvider: SubscriptionBillingProviderEnum.STRIPE,
      },
      {
        shopId: shopId2,
        status: SubscriptionStatusEnum.EXPIRED,
        currentPeriodEnd: pastEnd,
        billingProvider: SubscriptionBillingProviderEnum.COUPON,
      },
    ] as Awaited<ReturnType<ShopSubscriptionRepository['findByShopIds']>>);

    const result = await query.executeMany([shopId, shopId2, 'shop-3'], now);

    expect(repository.findByShopIds).toHaveBeenCalledWith([
      shopId,
      shopId2,
      'shop-3',
    ]);
    expect(result.get(shopId)?.active).toBe(true);
    expect(result.get(shopId2)?.active).toBe(false);
    expect(result.get('shop-3')?.active).toBe(false);
  });

  it('filterEntitledShopIds returns only active shops', async () => {
    repository.findByShopIds.mockResolvedValue([
      {
        shopId,
        status: SubscriptionStatusEnum.ACTIVE,
        currentPeriodEnd: futureEnd,
        billingProvider: SubscriptionBillingProviderEnum.STRIPE,
      },
    ] as Awaited<ReturnType<ShopSubscriptionRepository['findByShopIds']>>);

    const entitled = await query.filterEntitledShopIds(
      [shopId, shopId2],
      now,
    );

    expect(entitled).toEqual([shopId]);
  });

  it('shopHasActiveEntitlement builds exists filter', () => {
    const filter = query.shopHasActiveEntitlement('shop-id-column' as never, now);

    expect(filter).toBeDefined();
    expect(db.client.select).toHaveBeenCalled();
  });
});
