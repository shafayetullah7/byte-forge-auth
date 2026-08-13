import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionInvoiceStatusEnum } from '@/_db/drizzle/enum/subscription-invoice-status.enum';
import { SubscriptionStatusEnum } from '@/_db/drizzle/enum/subscription-status.enum';
import { ExtendShopSubscriptionCommand } from './extend-shop-subscription.command';

describe('ExtendShopSubscriptionCommand', () => {
  const shopId = '11111111-1111-4111-8111-111111111111';

  let db: { client: { select: jest.Mock }; transaction: jest.Mock };
  let shopSubscriptionRepository: {
    acquireShopLock: jest.Mock;
    findByShopId: jest.Mock;
    upsertByShopId: jest.Mock;
  };
  let subscriptionInvoiceRepository: {
    create: jest.Mock;
    findByShopId: jest.Mock;
  };
  let command: ExtendShopSubscriptionCommand;

  beforeEach(() => {
    db = {
      client: {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                execute: jest.fn().mockResolvedValue([{ id: shopId }]),
              }),
            }),
          }),
        }),
      },
      transaction: jest.fn(async (callback) => callback({})),
    };

    shopSubscriptionRepository = {
      acquireShopLock: jest.fn().mockResolvedValue(undefined),
      findByShopId: jest.fn().mockResolvedValue(null),
      upsertByShopId: jest.fn().mockResolvedValue({
        shopId,
        status: SubscriptionStatusEnum.ACTIVE,
        currentPeriodEnd: new Date('2026-09-13T00:00:00.000Z'),
        billingProvider: SubscriptionBillingProviderEnum.ADMIN,
        planId: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        cancelAtPeriodEnd: false,
        createdAt: new Date('2026-08-13T00:00:00.000Z'),
        updatedAt: new Date('2026-08-13T00:00:00.000Z'),
      }),
    };

    subscriptionInvoiceRepository = {
      create: jest.fn().mockResolvedValue({ id: 'invoice-1' }),
      findByShopId: jest.fn().mockResolvedValue([]),
    };

    command = new ExtendShopSubscriptionCommand(
      db as never,
      shopSubscriptionRepository as never,
      subscriptionInvoiceRepository as never,
    );
  });

  it('extends subscription by days inside a locked transaction', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-13T12:00:00.000Z'));

    const result = await command.execute(shopId, {
      days: 30,
      reason: 'Support goodwill extension',
    });

    expect(shopSubscriptionRepository.acquireShopLock).toHaveBeenCalledWith(
      shopId,
      expect.anything(),
    );
    expect(subscriptionInvoiceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId,
        provider: SubscriptionBillingProviderEnum.ADMIN,
        status: SubscriptionInvoiceStatusEnum.PAID,
        amountBdt: '0.00',
        metadata: expect.objectContaining({
          reason: 'Support goodwill extension',
          durationValue: 30,
          durationUnit: 'DAY',
        }),
      }),
      expect.anything(),
    );
    expect(result.shopId).toBe(shopId);
    expect(result.billingProvider).toBe(SubscriptionBillingProviderEnum.ADMIN);

    jest.useRealTimers();
  });

  it('throws when shop does not exist', async () => {
    db.client.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    await expect(
      command.execute(shopId, { months: 1, reason: 'Test' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid duration input from domain layer', async () => {
    await expect(
      command.execute(shopId, { days: -1, reason: 'Bad' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
