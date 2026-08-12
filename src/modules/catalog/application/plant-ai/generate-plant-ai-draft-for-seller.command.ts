import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ZodError } from 'zod';
import { AiDisabledError, AiGenerationError } from '@/libs/ai/ai.errors';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
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
  constructor(
    private readonly rateLimiter: PlantAiRateLimiterService,
    private readonly validateThumbnail: ValidatePlantAiThumbnailQuery,
    private readonly generatePlantAiDraft: GeneratePlantAiDraftCommand,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    input: GeneratePlantAiDraftForSellerInput,
  ): Promise<PlantAiDraftResponse> {
    this.rateLimiter.assertWithinLimit(input.shopId, input.lang);

    let imageUrl: string | undefined;
    if (input.request.thumbnailMediaId) {
      const thumbnail = await this.validateThumbnail.execute(
        input.request.thumbnailMediaId,
        input.userId,
        input.lang,
      );
      imageUrl = thumbnail.imageUrl;
    }

    try {
      return await this.generatePlantAiDraft.execute(input.request, {
        imageUrl,
      });
    } catch (error) {
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
              : 'message.error.plantAiGenerationFailed';

        throw new CustomException({
          message: this.i18n.t(messageKey, {
            lang: input.lang,
          }),
          statusCode:
            error.code === 'IMAGE_TOO_LARGE'
              ? HttpStatus.BAD_REQUEST
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
