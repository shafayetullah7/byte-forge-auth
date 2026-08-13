import { HttpStatus } from '@nestjs/common';
import { ProductStatusEnum } from '@/_db/drizzle/enum';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { CreatePlantCommand } from './create-plant.command';

describe('CreatePlantCommand pre-verification draft cap', () => {
  const shopId = 'shop-1';
  const userId = 'user-1';
  const lang = 'en';

  const minimalDto = {
    thumbnailId: '11111111-1111-1111-1111-111111111111',
    variants: [
      {
        sku: 'sku-1',
        price: 100,
        translations: { en: { title: 'Small' }, bn: { title: 'ছোট' } },
      },
    ],
    translations: [{ locale: 'en' as const, name: 'Test Plant' }],
    plantDetails: {
      categoryId: '22222222-2222-2222-2222-222222222222',
      lightRequirement: 'MEDIUM',
      wateringFrequency: 'WEEKLY',
      humidityLevel: 'MEDIUM',
      careDifficulty: 'EASY',
      growthRate: 'MODERATE',
      translations: {
        en: {},
        bn: {},
      },
    },
  };

  let command: CreatePlantCommand;
  let shopQueryService: { getShopById: jest.Mock };
  let i18n: { t: jest.Mock };
  let tx: {
    select: jest.Mock;
  };

  beforeEach(() => {
    shopQueryService = {
      getShopById: jest.fn().mockResolvedValue({ id: shopId, isVerified: false }),
    };
    i18n = {
      t: jest.fn().mockReturnValue('Draft cap reached'),
    };

    tx = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 10 }]),
        }),
      }),
    };

    const db = {
      transaction: jest.fn(async (callback: (innerTx: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    command = new CreatePlantCommand(
      db as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      shopQueryService as never,
      i18n as never,
    );
  });

  it('blocks the 11th draft when the shop is not verified', async () => {
    await expect(
      command.execute(shopId, userId, minimalDto as never, lang),
    ).rejects.toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ErrorCode.QUOTA_EXCEEDED,
    } satisfies Partial<CustomException>);

    expect(i18n.t).toHaveBeenCalledWith(
      'message.error.preVerificationDraftCapReached',
      { lang },
    );
  });

  it('does not enforce the cap for verified shops', async () => {
    shopQueryService.getShopById.mockResolvedValue({ id: shopId, isVerified: true });

    await expect(
      command.execute(shopId, userId, minimalDto as never, lang),
    ).rejects.not.toMatchObject({
      errorCode: ErrorCode.QUOTA_EXCEEDED,
    });

    expect(tx.select).not.toHaveBeenCalled();
  });

  it('does not enforce the cap when creating an active plant', async () => {
    await expect(
      command.execute(
        shopId,
        userId,
        { ...minimalDto, status: ProductStatusEnum.ACTIVE } as never,
        lang,
      ),
    ).rejects.not.toMatchObject({
      errorCode: ErrorCode.QUOTA_EXCEEDED,
    });

    expect(shopQueryService.getShopById).not.toHaveBeenCalled();
    expect(tx.select).not.toHaveBeenCalled();
  });
});
