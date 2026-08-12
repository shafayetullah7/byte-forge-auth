import { HttpStatus } from '@nestjs/common';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { PlantAiUsageRepository } from '../../repositories/plant-ai-usage.repository';
import { PlantAiRateLimiterService } from './plant-ai-rate-limiter.service';

describe('PlantAiRateLimiterService', () => {
  const appConfig = {
    plantAiRateLimitPerDay: 2,
  };

  const i18n = {
    t: jest.fn((key: string) => key),
  };

  const usageRepository = {
    reserveDailySlot: jest.fn(),
  };

  let limiter: PlantAiRateLimiterService;

  beforeEach(() => {
    jest.clearAllMocks();
    limiter = new PlantAiRateLimiterService(
      appConfig as unknown as AppConfigService,
      i18n as never,
      usageRepository as unknown as PlantAiUsageRepository,
    );
  });

  it('allows requests up to the daily limit', async () => {
    usageRepository.reserveDailySlot
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    await expect(limiter.assertWithinLimit('shop-1', 'en')).resolves.toBeUndefined();
    await expect(limiter.assertWithinLimit('shop-1', 'en')).resolves.toBeUndefined();
  });

  it('throws when the daily limit is exceeded', async () => {
    usageRepository.reserveDailySlot.mockResolvedValue(3);

    await expect(limiter.assertWithinLimit('shop-1', 'en')).rejects.toThrow(
      CustomException,
    );

    try {
      await limiter.assertWithinLimit('shop-1', 'en');
    } catch (error) {
      expect(error).toBeInstanceOf(CustomException);
      expect((error as CustomException).statusCode).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('tracks limits per shop independently via repository', async () => {
    usageRepository.reserveDailySlot
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    await limiter.assertWithinLimit('shop-1', 'en');
    await limiter.assertWithinLimit('shop-1', 'en');
    await expect(limiter.assertWithinLimit('shop-2', 'en')).resolves.toBeUndefined();
  });
});
