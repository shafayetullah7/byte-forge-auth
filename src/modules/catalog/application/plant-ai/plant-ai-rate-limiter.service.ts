import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { PlantAiUsageRepository } from '../../repositories/plant-ai-usage.repository';

@Injectable()
export class PlantAiRateLimiterService {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly i18n: I18nService,
    private readonly usageRepository: PlantAiUsageRepository,
  ) {}

  async assertWithinLimit(shopId: string, lang: string): Promise<void> {
    const limit = this.appConfig.plantAiRateLimitPerDay;
    const requestCount = await this.usageRepository.reserveDailySlot(shopId);

    if (requestCount > limit) {
      throw new CustomException({
        message: this.i18n.t('message.error.plantAiRateLimited', { lang }),
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        errorCode: ErrorCode.TOO_MANY_REQUESTS,
        details: `Limit: ${limit} requests per shop per day`,
      });
    }
  }
}
