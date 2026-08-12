import { Injectable, Logger } from '@nestjs/common';
import { ZodError } from 'zod';
import { AiDisabledError, AiGenerationError } from '@/libs/ai/ai.errors';
import { plantAiDebugLog } from '@/libs/ai/ai-error-debug.util';
import { createGeminiClient, type GeminiClient } from '@/libs/ai/gemini.client';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import {
  BuildPlantAiContextQuery,
  plantAiAllowlistsFromContext,
} from './build-plant-ai-context.query';
import { buildPlantAiDraftGeminiResponseSchema } from './plant-ai-draft.gemini-schema';
import {
  parsePlantAiDraftResponse,
  type PlantAiDraftRequest,
  type PlantAiDraftResponse,
} from './plant-ai-draft.schema';
import {
  PLANT_AI_SYSTEM_INSTRUCTION,
  buildPlantAiUserPrompt,
} from './plant-ai.prompt';

export type GeneratePlantAiDraftOptions = {
  /** Resolved thumbnail URL (Phase 3+). */
  imageUrl?: string;
  /** Inject mock client in tests. */
  geminiClient?: GeminiClient;
};

@Injectable()
export class GeneratePlantAiDraftCommand {
  private readonly logger = new Logger(GeneratePlantAiDraftCommand.name);

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly buildPlantAiContext: BuildPlantAiContextQuery,
  ) {}

  async execute(
    request: PlantAiDraftRequest,
    options: GeneratePlantAiDraftOptions = {},
  ): Promise<PlantAiDraftResponse> {
    if (!this.appConfig.isPlantAiEnabled && !options.geminiClient) {
      throw new AiDisabledError();
    }

    const context = await this.buildPlantAiContext.execute();
    const allowlists = plantAiAllowlistsFromContext(context);
    plantAiDebugLog('GenerateCommand', 'context.loaded', {
      categoryCount: context.categories.length,
      tagCount: context.tags.length,
      model: this.appConfig.geminiModel,
    });

    const client =
      options.geminiClient ??
      createGeminiClient({
        plantAiEnabled: this.appConfig.isPlantAiEnabled,
        geminiApiKey: this.appConfig.geminiApiKey,
        geminiModel: this.appConfig.geminiModel,
        maxImageBytes: this.appConfig.plantAiMaxImageBytes,
        maxOutputTokens: this.appConfig.plantAiMaxOutputTokens,
        timeoutMs: this.appConfig.plantAiGeminiTimeoutMs,
      });

    const userText = buildPlantAiUserPrompt(request, context);
    const responseSchema = buildPlantAiDraftGeminiResponseSchema();

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        plantAiDebugLog('GenerateCommand', 'gemini.attempt', {
          attempt: attempt + 1,
          hasImageUrl: Boolean(options.imageUrl),
        });
        const raw = await client.generateJson<unknown>({
          systemInstruction: PLANT_AI_SYSTEM_INSTRUCTION,
          userText,
          imageUrl: options.imageUrl,
          responseSchema,
        });

        return parsePlantAiDraftResponse(raw, allowlists);
      } catch (error) {
        lastError = error;
        plantAiDebugLog('GenerateCommand', 'gemini.attemptFailed', {
          attempt: attempt + 1,
          errorName: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        if (
          error instanceof AiGenerationError &&
          error.code === 'RATE_LIMITED'
        ) {
          throw error;
        }

        const retryable =
          attempt === 0 &&
          (error instanceof ZodError ||
            (error instanceof AiGenerationError &&
              error.code === 'INVALID_JSON'));

        if (!retryable) {
          throw error;
        }

        this.logger.warn(
          JSON.stringify({
            event: 'plant_ai.generate.retry',
            attempt: attempt + 1,
            reason:
              error instanceof ZodError ? 'validation_failed' : 'invalid_json',
          }),
        );
      }
    }

    throw lastError;
  }
}
