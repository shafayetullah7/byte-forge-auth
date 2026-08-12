import {
  GoogleGenerativeAI,
  type ResponseSchema,
} from '@google/generative-ai';
import { AiDisabledError, AiGenerationError } from './ai.errors';

const DEFAULT_TIMEOUT_MS = 30_000;

export type GeminiClientConfig = {
  apiKey: string;
  model: string;
  timeoutMs?: number;
};

export type GeminiGenerateJsonParams = {
  systemInstruction: string;
  userText: string;
  imageUrl?: string;
  responseSchema: ResponseSchema;
};

export class GeminiClient {
  private readonly timeoutMs: number;

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    options?: { timeoutMs?: number },
  ) {
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async generateJson<T>(params: GeminiGenerateJsonParams): Promise<T> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: params.systemInstruction,
    });

    const userParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
      [{ text: params.userText }];

    if (params.imageUrl) {
      const inlineData = await this.fetchImageAsInlineData(params.imageUrl);
      userParts.push({ inlineData });
    }

    try {
      const result = await model.generateContent(
        {
          contents: [{ role: 'user', parts: userParts }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: params.responseSchema,
          },
        },
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );

      const text = result.response.text();
      if (!text?.trim()) {
        throw new AiGenerationError('Gemini returned an empty response');
      }

      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof AiGenerationError) {
        throw error;
      }
      if (error instanceof SyntaxError) {
        throw new AiGenerationError('Gemini returned invalid JSON', error);
      }
      throw new AiGenerationError('Gemini request failed', error);
    }
  }

  private async fetchImageAsInlineData(
    imageUrl: string,
  ): Promise<{ mimeType: string; data: string }> {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      throw new AiGenerationError(
        `Failed to fetch image for Gemini (${response.status})`,
      );
    }

    const mimeType = response.headers.get('content-type') ?? 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      throw new AiGenerationError('Image URL did not return an image content type');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      mimeType,
      data: buffer.toString('base64'),
    };
  }
}

export type CreateGeminiClientInput = {
  plantAiEnabled: boolean;
  geminiApiKey?: string;
  geminiModel: string;
};

export function createGeminiClient(input: CreateGeminiClientInput): GeminiClient {
  if (!input.plantAiEnabled || !input.geminiApiKey?.trim()) {
    throw new AiDisabledError();
  }

  return new GeminiClient(input.geminiApiKey.trim(), input.geminiModel);
}
