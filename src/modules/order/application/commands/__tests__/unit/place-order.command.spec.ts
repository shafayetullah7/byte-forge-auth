import { HttpStatus } from '@nestjs/common';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { SubscriptionStatus } from '@/modules/subscription/domain/subscription-status';
import { CheckSellerSubscriptionQuery } from '@/modules/subscription/application/queries/check-seller-subscription.query';
import { PlaceOrderCommand } from '../../place-order.command';
import type { PlaceOrderItem } from '../../place-order.command.types';

type AssertShopsAcceptOrders = (
  shopGroups: Map<string, PlaceOrderItem[]>,
  lang: string,
) => Promise<void>;

describe('PlaceOrderCommand shop subscription gate', () => {
  const shopId = 'shop-1';
  const lang = 'en';

  let command: PlaceOrderCommand;
  let assertShopsAcceptOrders: AssertShopsAcceptOrders;
  let checkSellerSubscription: jest.Mocked<
    Pick<CheckSellerSubscriptionQuery, 'executeMany'>
  >;
  let i18n: { t: jest.Mock };

  beforeEach(() => {
    checkSellerSubscription = {
      executeMany: jest.fn(),
    };
    i18n = {
      t: jest.fn((key: string) => key),
    };

    command = new PlaceOrderCommand(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      checkSellerSubscription as unknown as CheckSellerSubscriptionQuery,
      i18n as never,
    );

    assertShopsAcceptOrders = (
      command as unknown as {
        assertShopsAcceptOrders: AssertShopsAcceptOrders;
      }
    ).assertShopsAcceptOrders.bind(command);
  });

  it('rejects checkout when a shop is not accepting orders', async () => {
    checkSellerSubscription.executeMany.mockResolvedValue(
      new Map([
        [
          shopId,
          {
            active: false,
            status: SubscriptionStatus.EXPIRED,
            currentPeriodEnd: new Date('2026-01-01T00:00:00.000Z'),
            billingProvider: 'COUPON',
          },
        ],
      ]),
    );

    const shopGroups = new Map<string, PlaceOrderItem[]>([
      [
        shopId,
        [
          {
            id: 'item-1',
            variantId: 'variant-1',
            productId: 'product-1',
            quantity: 1,
            price: '100.00',
            productName: 'Monstera',
            productSlug: 'monstera',
            shopId,
            shopName: 'Green Nursery',
          },
        ],
      ],
    ]);

    await expect(assertShopsAcceptOrders(shopGroups, lang)).rejects.toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ErrorCode.SHOP_UNAVAILABLE,
    } satisfies Partial<CustomException>);

    expect(i18n.t).toHaveBeenCalledWith(
      'message.error.shopUnavailableForOrdersNamed',
      {
        lang,
        args: { shopName: 'Green Nursery' },
      },
    );
  });
});
