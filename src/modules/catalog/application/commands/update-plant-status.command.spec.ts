import { HttpStatus } from '@nestjs/common';
import { ProductStatusEnum } from '@/_db/drizzle/enum';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { SubscriptionStatus } from '@/modules/subscription/domain/subscription-status';
import { CheckSellerSubscriptionQuery } from '@/modules/subscription/application/queries/check-seller-subscription.query';
import { UpdatePlantStatusCommand } from './update-plant-status.command';

describe('UpdatePlantStatusCommand subscription gate', () => {
  const userId = 'user-1';
  const shopId = 'shop-1';
  const plantId = 'plant-1';
  const lang = 'en';

  let command: UpdatePlantStatusCommand;
  let checkSellerSubscription: jest.Mocked<
    Pick<CheckSellerSubscriptionQuery, 'execute'>
  >;
  let plantPublishValidator: { assertPublishReady: jest.Mock };
  let getSellerPlantByIdQuery: { executeForShop: jest.Mock };
  let shopQueryService: { getShopByOwnerId: jest.Mock };
  let i18n: { t: jest.Mock };
  let tx: {
    query: { productsTable: { findFirst: jest.Mock } };
    update: jest.Mock;
  };

  beforeEach(() => {
    checkSellerSubscription = { execute: jest.fn() };
    plantPublishValidator = { assertPublishReady: jest.fn().mockResolvedValue(undefined) };
    getSellerPlantByIdQuery = {
      executeForShop: jest.fn().mockResolvedValue({ id: plantId }),
    };
    shopQueryService = {
      getShopByOwnerId: jest.fn().mockResolvedValue({ id: shopId }),
    };
    i18n = {
      t: jest.fn().mockReturnValue('Subscription required to publish'),
    };

    tx = {
      query: {
        productsTable: {
          findFirst: jest.fn().mockResolvedValue({
            id: plantId,
            shopId,
            productType: 'plant',
            status: ProductStatusEnum.DRAFT,
            thumbnailId: 'thumb-1',
          }),
        },
      },
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      }),
    };

    const db = {
      transaction: jest.fn(async (callback: (innerTx: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    command = new UpdatePlantStatusCommand(
      db as never,
      plantPublishValidator as never,
      getSellerPlantByIdQuery as never,
      shopQueryService as never,
      checkSellerSubscription as unknown as CheckSellerSubscriptionQuery,
      i18n as never,
    );
  });

  it('blocks publish when subscription entitlement is inactive', async () => {
    checkSellerSubscription.execute.mockResolvedValue({
      active: false,
      status: SubscriptionStatus.EXPIRED,
      currentPeriodEnd: new Date('2026-01-01T00:00:00.000Z'),
      billingProvider: 'COUPON',
    });

    await expect(
      command.execute(userId, plantId, ProductStatusEnum.ACTIVE, lang),
    ).rejects.toMatchObject({
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: ErrorCode.SUBSCRIPTION_REQUIRED,
    } satisfies Partial<CustomException>);

    expect(plantPublishValidator.assertPublishReady).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('allows publish when subscription entitlement is active', async () => {
    checkSellerSubscription.execute.mockResolvedValue({
      active: true,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date('2026-12-01T00:00:00.000Z'),
      billingProvider: 'STRIPE',
    });

    await command.execute(userId, plantId, ProductStatusEnum.ACTIVE, lang);

    expect(plantPublishValidator.assertPublishReady).toHaveBeenCalled();
    expect(tx.update).toHaveBeenCalled();
  });

  it('does not check subscription when archiving', async () => {
    tx.query.productsTable.findFirst.mockResolvedValue({
      id: plantId,
      shopId,
      productType: 'plant',
      status: ProductStatusEnum.ACTIVE,
      thumbnailId: 'thumb-1',
    });

    await command.execute(userId, plantId, ProductStatusEnum.ARCHIVED, lang);

    expect(checkSellerSubscription.execute).not.toHaveBeenCalled();
    expect(plantPublishValidator.assertPublishReady).not.toHaveBeenCalled();
    expect(tx.update).toHaveBeenCalled();
  });
});
