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
  private readonly maxImageBytes: number;

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    options?: { timeoutMs?: number; maxImageBytes?: number },
  ) {
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxImageBytes = options?.maxImageBytes ?? 5 * 1024 * 1024;
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
        throw new AiGenerationError(
          'Gemini returned an empty response',
          undefined,
          'EMPTY_RESPONSE',
        );
      }

      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof AiGenerationError) {
        throw error;
      }
      if (error instanceof SyntaxError) {
        throw new AiGenerationError(
          'Gemini returned invalid JSON',
          error,
          'INVALID_JSON',
        );
      }
      throw new AiGenerationError(
        'Gemini request failed',
        error,
        'REQUEST_FAILED',
      );
    }
  }

  private async fetchImageAsInlineData(
    imageUrl: string,
  ): Promise<{ mimeType: string; data: string }> {
    let response: Response;
    try {
      response = await fetch(imageUrl, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new AiGenerationError(
        'Failed to fetch image for Gemini',
        error,
        'IMAGE_FETCH_FAILED',
      );
    }

    if (!response.ok) {
      throw new AiGenerationError(
        `Failed to fetch image for Gemini (${response.status})`,
        undefined,
        'IMAGE_FETCH_FAILED',
      );
    }

    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      throw new AiGenerationError(
        'Image URL did not return an image content type',
        undefined,
        'IMAGE_FETCH_FAILED',
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > this.maxImageBytes) {
      throw new AiGenerationError(
        `Plant image exceeds ${this.maxImageBytes} bytes`,
        undefined,
        'IMAGE_TOO_LARGE',
      );
    }

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
  maxImageBytes?: number;
};

export function createGeminiClient(input: CreateGeminiClientInput): GeminiClient {
  if (!input.plantAiEnabled || !input.geminiApiKey?.trim()) {
    throw new AiDisabledError();
  }

  return new GeminiClient(input.geminiApiKey.trim(), input.geminiModel, {
    maxImageBytes: input.maxImageBytes,
  });
}
