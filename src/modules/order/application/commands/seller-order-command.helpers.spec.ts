import { HttpStatus } from '@nestjs/common';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { SubscriptionStatus } from '@/modules/subscription/domain/subscription-status';
import { CheckSellerSubscriptionQuery } from '@/modules/subscription/application/queries/check-seller-subscription.query';
import { assertSellerSubscriptionAllowsFulfillment } from './seller-order-command.helpers';

describe('assertSellerSubscriptionAllowsFulfillment', () => {
  const shopId = 'shop-1';
  const lang = 'en';

  it('allows fulfillment when enforcement is off', async () => {
    const checkSellerSubscription = {
      isEnforcementEnabled: () => false,
      execute: jest.fn(),
    } as unknown as CheckSellerSubscriptionQuery;
    const i18n = { t: jest.fn() };

    await expect(
      assertSellerSubscriptionAllowsFulfillment(
        checkSellerSubscription,
        shopId,
        lang,
        i18n as never,
      ),
    ).resolves.toBeUndefined();
  });

  it('blocks fulfillment when subscription is inactive', async () => {
    const checkSellerSubscription = {
      isEnforcementEnabled: () => true,
      execute: jest.fn().mockResolvedValue({
        active: false,
        status: SubscriptionStatus.EXPIRED,
        currentPeriodEnd: new Date('2026-01-01T00:00:00.000Z'),
        billingProvider: 'COUPON',
      }),
    } as unknown as CheckSellerSubscriptionQuery;
    const i18n = {
      t: jest.fn().mockReturnValue('Subscription required for fulfillment'),
    };

    await expect(
      assertSellerSubscriptionAllowsFulfillment(
        checkSellerSubscription,
        shopId,
        lang,
        i18n as never,
      ),
    ).rejects.toMatchObject({
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: ErrorCode.SUBSCRIPTION_REQUIRED,
    } satisfies Partial<CustomException>);
  });
});
