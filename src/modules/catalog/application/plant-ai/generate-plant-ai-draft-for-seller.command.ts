import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ZodError } from 'zod';
import { AiDisabledError, AiGenerationError } from '@/libs/ai/ai.errors';
import { formatAiErrorForLog, plantAiDebugLog } from '@/libs/ai/ai-error-debug.util';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { PlantAiUsageRepository } from '../../repositories/plant-ai-usage.repository';
import { GeneratePlantAiDraftCommand } from './generate-plant-ai-draft.command';
import { PlantAiRateLimiterService } from './plant-ai-rate-limiter.service';
import type { PlantAiDraftRequest, PlantAiDraftResponse } from './plant-ai-draft.schema';
import { ValidatePlantAiThumbnailQuery } from './validate-plant-ai-thumbnail.query';

export type GeneratePlantAiDraftForSellerInput = {
  shopId: string;
  userId: string;
  request: PlantAiDraftRequest;
  lang: string;
};

@Injectable()
export class GeneratePlantAiDraftForSellerCommand {
  private readonly logger = new Logger(GeneratePlantAiDraftForSellerCommand.name);

  constructor(
    private readonly rateLimiter: PlantAiRateLimiterService,
    private readonly validateThumbnail: ValidatePlantAiThumbnailQuery,
    private readonly generatePlantAiDraft: GeneratePlantAiDraftCommand,
    private readonly usageRepository: PlantAiUsageRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    input: GeneratePlantAiDraftForSellerInput,
  ): Promise<PlantAiDraftResponse> {
    await this.rateLimiter.assertWithinLimit(input.shopId, input.lang);
    plantAiDebugLog('ForSeller', 'rateLimit.passed', { shopId: input.shopId });

    let imageUrl: string | undefined;
    if (input.request.thumbnailMediaId) {
      plantAiDebugLog('ForSeller', 'thumbnail.validate.start', {
        thumbnailMediaId: input.request.thumbnailMediaId,
      });
      const thumbnail = await this.validateThumbnail.execute(
        input.request.thumbnailMediaId,
        input.userId,
        input.lang,
      );
      imageUrl = thumbnail.imageUrl;
      plantAiDebugLog('ForSeller', 'thumbnail.validate.done', {
        hasImageUrl: Boolean(imageUrl),
      });
    }

    const startedAt = Date.now();
    try {
      plantAiDebugLog('ForSeller', 'generate.start', {
        hasPlantName: Boolean(input.request.plantName?.trim()),
        hasScientificName: Boolean(input.request.scientificName?.trim()),
        hasThumbnail: Boolean(input.request.thumbnailMediaId),
      });
      const draft = await this.generatePlantAiDraft.execute(input.request, {
        imageUrl,
      });

      await this.usageRepository.recordOutcome(input.shopId, 'success');
      this.logger.log(
        JSON.stringify({
          event: 'plant_ai.generate.success',
          shopId: input.shopId,
          durationMs: Date.now() - startedAt,
          hasThumbnail: Boolean(input.request.thumbnailMediaId),
          photoOnly: Boolean(
            input.request.thumbnailMediaId &&
              !input.request.plantName?.trim() &&
              !input.request.scientificName?.trim(),
          ),
        }),
      );

      return draft;
    } catch (error) {
      await this.usageRepository.recordOutcome(input.shopId, 'error');

      const errorCode =
        error instanceof AiGenerationError
          ? error.code
          : error instanceof ZodError
            ? 'VALIDATION_FAILED'
            : error instanceof AiDisabledError
              ? 'DISABLED'
              : 'UNKNOWN';

      this.logger.warn(
        JSON.stringify({
          event: 'plant_ai.generate.error',
          shopId: input.shopId,
          durationMs: Date.now() - startedAt,
          errorCode,
          errorDetail: formatAiErrorForLog(error),
        }),
      );

      if (error instanceof AiDisabledError) {
        throw new CustomException({
          message: this.i18n.t('message.error.plantAiDisabled', {
            lang: input.lang,
          }),
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        });
      }

      if (error instanceof ZodError) {
        throw new CustomException({
          message: this.i18n.t('message.error.plantAiDraftRejected', {
            lang: input.lang,
          }),
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          errorCode: ErrorCode.VALIDATION_ERROR,
          validationErrors: error.issues.map((issue) => ({
            field: issue.path.join('.') || 'draft',
            message: issue.message,
          })),
        });
      }

      if (error instanceof AiGenerationError) {
        const messageKey =
          error.code === 'IMAGE_FETCH_FAILED'
            ? 'message.error.plantAiImageFetchFailed'
            : error.code === 'IMAGE_TOO_LARGE'
              ? 'message.error.plantAiImageTooLarge'
              : error.code === 'MODEL_OVERLOADED'
                ? 'message.error.plantAiModelBusy'
                : 'message.error.plantAiGenerationFailed';

        throw new CustomException({
          message: this.i18n.t(messageKey, {
            lang: input.lang,
          }),
          statusCode:
            error.code === 'IMAGE_TOO_LARGE'
              ? HttpStatus.BAD_REQUEST
              : error.code === 'TIMEOUT'
                ? HttpStatus.GATEWAY_TIMEOUT
                : HttpStatus.BAD_GATEWAY,
          errorCode:
            error.code === 'IMAGE_TOO_LARGE'
              ? ErrorCode.VALIDATION_ERROR
              : ErrorCode.SERVICE_UNAVAILABLE,
        });
      }

      throw error;
    }
  }
}
