import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionDurationUnitEnum } from '@/_db/drizzle/enum/subscription-duration-unit.enum';
import { SubscriptionStatusEnum } from '@/_db/drizzle/enum/subscription-status.enum';
import { SubscriptionStatus } from '../../../../domain/subscription-status';
import { ShopSubscriptionRepository } from '../../../../repositories/shop-subscription.repository';
import { SubscriptionCouponRepository } from '../../../../repositories/subscription-coupon.repository';
import { SubscriptionInvoiceRepository } from '../../../../repositories/subscription-invoice.repository';
import { SubscriptionPlanRepository } from '../../../../repositories/subscription-plan.repository';
import { RedeemSubscriptionCouponCommand } from '../../redeem-subscription-coupon.command';

describe('RedeemSubscriptionCouponCommand', () => {
  const shopId = '11111111-1111-4111-8111-111111111111';
  const couponId = '22222222-2222-4222-8222-222222222222';
  const now = new Date('2026-06-01T00:00:00.000Z');

  const couponRow = {
    id: couponId,
    code: 'WELCOME30',
    durationValue: 30,
    durationUnit: SubscriptionDurationUnitEnum.DAY,
    maxRedemptions: 10,
    redemptionCount: 0,
    validFrom: null,
    validUntil: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  let db: { transaction: jest.Mock };
  let shopSubscriptionRepository: {
    acquireShopLock: jest.Mock;
    findByShopId: jest.Mock;
    upsertByShopId: jest.Mock;
  };
  let subscriptionCouponRepository: {
    findByCodeForUpdate: jest.Mock;
    findRedemptionByShopAndCoupon: jest.Mock;
    tryIncrementRedemptionCount: jest.Mock;
    createRedemption: jest.Mock;
  };
  let subscriptionInvoiceRepository: { create: jest.Mock };
  let subscriptionPlanRepository: { findAll: jest.Mock };
  let command: RedeemSubscriptionCouponCommand;

  beforeEach(() => {
    db = {
      transaction: jest.fn(async (callback) => callback({})),
    };

    shopSubscriptionRepository = {
      acquireShopLock: jest.fn().mockResolvedValue(undefined),
      findByShopId: jest.fn().mockResolvedValue(null),
      upsertByShopId: jest.fn().mockResolvedValue({
        shopId,
        status: SubscriptionStatusEnum.ACTIVE,
        currentPeriodEnd: new Date('2026-07-01T00:00:00.000Z'),
        billingProvider: SubscriptionBillingProviderEnum.COUPON,
        planId: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      }),
    };

    subscriptionCouponRepository = {
      findByCodeForUpdate: jest.fn().mockResolvedValue(couponRow),
      findRedemptionByShopAndCoupon: jest.fn().mockResolvedValue(null),
      tryIncrementRedemptionCount: jest.fn().mockResolvedValue(true),
      createRedemption: jest.fn().mockResolvedValue({ id: 'redemption-1' }),
    };

    subscriptionInvoiceRepository = {
      create: jest.fn().mockResolvedValue({ id: 'invoice-1' }),
    };

    subscriptionPlanRepository = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    command = new RedeemSubscriptionCouponCommand(
      db as never,
      shopSubscriptionRepository as never,
      subscriptionCouponRepository as never,
      subscriptionInvoiceRepository as never,
      subscriptionPlanRepository as never,
    );
  });

  it('redeems coupon and extends subscription', async () => {
    jest.useFakeTimers().setSystemTime(now);

    const result = await command.execute(shopId, { code: 'welcome30' });

    expect(shopSubscriptionRepository.acquireShopLock).toHaveBeenCalledWith(
      shopId,
      expect.anything(),
    );
    expect(
      subscriptionCouponRepository.findByCodeForUpdate,
    ).toHaveBeenCalledWith('welcome30', expect.anything());
    expect(subscriptionCouponRepository.createRedemption).toHaveBeenCalled();
    expect(subscriptionInvoiceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: SubscriptionBillingProviderEnum.COUPON,
        amountBdt: '0.00',
      }),
      expect.anything(),
    );
    expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    expect(result.active).toBe(true);

    jest.useRealTimers();
  });

  it('throws 404 when coupon code is unknown', async () => {
    subscriptionCouponRepository.findByCodeForUpdate.mockResolvedValue(null);

    await expect(
      command.execute(shopId, { code: 'MISSING' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 409 when subscription is still active (no stacking)', async () => {
    shopSubscriptionRepository.findByShopId.mockResolvedValue({
      shopId,
      currentPeriodEnd: new Date('2026-12-01T00:00:00.000Z'),
    });

    await expect(
      command.execute(shopId, { code: 'WELCOME30' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws 409 when coupon redemption cap is exhausted under lock', async () => {
    subscriptionCouponRepository.tryIncrementRedemptionCount.mockResolvedValue(
      false,
    );

    await expect(
      command.execute(shopId, { code: 'WELCOME30' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws 400 when coupon is inactive', async () => {
    subscriptionCouponRepository.findByCodeForUpdate.mockResolvedValue({
      ...couponRow,
      isActive: false,
    });

    await expect(
      command.execute(shopId, { code: 'WELCOME30' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
