import { HttpStatus } from '@nestjs/common';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { PlantAiRateLimiterService } from './plant-ai-rate-limiter.service';

describe('PlantAiRateLimiterService', () => {
  const appConfig = {
    plantAiRateLimitPerDay: 2,
  };

  const i18n = {
    t: jest.fn((key: string) => key),
  };

  let limiter: PlantAiRateLimiterService;

  beforeEach(() => {
    jest.clearAllMocks();
    limiter = new PlantAiRateLimiterService(
      appConfig as unknown as AppConfigService,
      i18n as never,
    );
    limiter.reset();
  });

  it('allows requests up to the daily limit', () => {
    expect(() => limiter.assertWithinLimit('shop-1', 'en')).not.toThrow();
    expect(() => limiter.assertWithinLimit('shop-1', 'en')).not.toThrow();
  });

  it('throws when the daily limit is exceeded', () => {
    limiter.assertWithinLimit('shop-1', 'en');
    limiter.assertWithinLimit('shop-1', 'en');

    expect(() => limiter.assertWithinLimit('shop-1', 'en')).toThrow(
      CustomException,
    );

    try {
      limiter.assertWithinLimit('shop-1', 'en');
    } catch (error) {
      expect(error).toBeInstanceOf(CustomException);
      expect((error as CustomException).statusCode).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('tracks limits per shop independently', () => {
    limiter.assertWithinLimit('shop-1', 'en');
    limiter.assertWithinLimit('shop-1', 'en');
    expect(() => limiter.assertWithinLimit('shop-2', 'en')).not.toThrow();
  });
});
