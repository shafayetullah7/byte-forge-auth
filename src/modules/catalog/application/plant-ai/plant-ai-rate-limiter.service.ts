import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';

type RateBucket = {
  count: number;
  resetAt: number;
};

/**
 * In-memory per-shop daily cap. Resets at UTC midnight.
 * Note: not shared across app instances — acceptable for v1 per plan.
 */
@Injectable()
export class PlantAiRateLimiterService {
  private readonly buckets = new Map<string, RateBucket>();

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly i18n: I18nService,
  ) {}

  assertWithinLimit(shopId: string, lang: string): void {
    const limit = this.appConfig.plantAiRateLimitPerDay;
    const now = Date.now();
    const bucket = this.buckets.get(shopId);

    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(shopId, { count: 1, resetAt: nextUtcMidnightMs() });
      return;
    }

    if (bucket.count >= limit) {
      throw new CustomException({
        message: this.i18n.t('message.error.plantAiRateLimited', { lang }),
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        errorCode: ErrorCode.TOO_MANY_REQUESTS,
        details: `Limit: ${limit} requests per shop per day`,
      });
    }

    bucket.count += 1;
  }

  /** Visible for unit tests. */
  reset(): void {
    this.buckets.clear();
  }
}

function nextUtcMidnightMs(): number {
  const reset = new Date();
  reset.setUTCHours(24, 0, 0, 0);
  return reset.getTime();
}
