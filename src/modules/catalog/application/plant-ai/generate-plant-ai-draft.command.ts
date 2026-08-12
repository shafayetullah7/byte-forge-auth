import { Injectable } from '@nestjs/common';
import { AiDisabledError } from '@/libs/ai/ai.errors';
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

    const client =
      options.geminiClient ??
      createGeminiClient({
        plantAiEnabled: this.appConfig.isPlantAiEnabled,
        geminiApiKey: this.appConfig.geminiApiKey,
        geminiModel: this.appConfig.geminiModel,
      });

    const raw = await client.generateJson<unknown>({
      systemInstruction: PLANT_AI_SYSTEM_INSTRUCTION,
      userText: buildPlantAiUserPrompt(request, context),
      imageUrl: options.imageUrl,
      responseSchema: buildPlantAiDraftGeminiResponseSchema(),
    });

    return parsePlantAiDraftResponse(raw, allowlists);
  }
}
