import {
  GoogleGenerativeAI,
  type ResponseSchema,
} from '@google/generative-ai';
import {
  formatAiErrorForLog,
  plantAiDebugLog,
} from './ai-error-debug.util';
import { AiDisabledError, AiGenerationError } from './ai.errors';

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

function isGeminiRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { status?: number }).status;
  if (status === 429) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /429|resource exhausted|rate limit/i.test(message);
}

function isGeminiOverloadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { status?: number }).status;
  if (status === 503) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /503|service unavailable|high demand|overloaded|unavailable/i.test(
    message,
  );
}

function isGeminiTimeoutError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : '';
  return (
    name === 'AbortError' ||
    name === 'TimeoutError' ||
    /aborted|timeout|timed out|deadline exceeded/i.test(message)
  );
}

export type GeminiClientConfig = {
  apiKey: string;
  model: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
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
  private readonly maxOutputTokens: number;

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    options?: { timeoutMs?: number; maxImageBytes?: number; maxOutputTokens?: number },
  ) {
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxImageBytes = options?.maxImageBytes ?? 5 * 1024 * 1024;
    this.maxOutputTokens = options?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  }

  async generateJson<T>(params: GeminiGenerateJsonParams): Promise<T> {
    plantAiDebugLog('GeminiClient', 'generateJson.start', {
      model: this.modelName,
      hasImage: Boolean(params.imageUrl),
      userTextLength: params.userText.length,
      maxOutputTokens: this.maxOutputTokens,
      timeoutMs: this.timeoutMs,
    });

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: params.systemInstruction,
    });

    const userParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
      [{ text: params.userText }];

    if (params.imageUrl) {
      plantAiDebugLog('GeminiClient', 'fetchImage.start', {
        imageUrlHost: safeUrlHost(params.imageUrl),
      });
      const inlineData = await this.fetchImageAsInlineData(params.imageUrl);
      plantAiDebugLog('GeminiClient', 'fetchImage.done', {
        mimeType: inlineData.mimeType,
        base64Length: inlineData.data.length,
      });
      userParts.push({ inlineData });
    }

    try {
      plantAiDebugLog('GeminiClient', 'generateContent.start');
      const result = await model.generateContent(
        {
          contents: [{ role: 'user', parts: userParts }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: params.responseSchema,
            maxOutputTokens: this.maxOutputTokens,
          },
        },
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );

      const text = result.response.text();
      plantAiDebugLog('GeminiClient', 'generateContent.done', {
        responseTextLength: text?.length ?? 0,
      });

      if (!text?.trim()) {
        plantAiDebugLog('GeminiClient', 'generateContent.emptyResponse');
        throw new AiGenerationError(
          'Gemini returned an empty response',
          undefined,
          'EMPTY_RESPONSE',
        );
      }

      return JSON.parse(text) as T;
    } catch (error) {
      plantAiDebugLog('GeminiClient', 'generateJson.error', {
        mappedCode:
          error instanceof AiGenerationError
            ? error.code
            : error instanceof SyntaxError
              ? 'INVALID_JSON'
              : isGeminiRateLimitError(error)
                ? 'RATE_LIMITED'
                : 'REQUEST_FAILED',
        error: formatAiErrorForLog(error),
      });

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
      if (isGeminiRateLimitError(error)) {
        throw new AiGenerationError(
          'Gemini rate limit exceeded',
          error,
          'RATE_LIMITED',
        );
      }
      if (isGeminiTimeoutError(error)) {
        throw new AiGenerationError(
          `Gemini request timed out after ${this.timeoutMs}ms`,
          error,
          'TIMEOUT',
        );
      }
      if (isGeminiOverloadError(error)) {
        throw new AiGenerationError(
          'Gemini model is temporarily overloaded',
          error,
          'MODEL_OVERLOADED',
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
      plantAiDebugLog('GeminiClient', 'fetchImage.networkError', {
        imageUrlHost: safeUrlHost(imageUrl),
        error: formatAiErrorForLog(error),
      });
      throw new AiGenerationError(
        'Failed to fetch image for Gemini',
        error,
        'IMAGE_FETCH_FAILED',
      );
    }

    if (!response.ok) {
      plantAiDebugLog('GeminiClient', 'fetchImage.httpError', {
        imageUrlHost: safeUrlHost(imageUrl),
        status: response.status,
        statusText: response.statusText,
      });
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
  maxOutputTokens?: number;
  timeoutMs?: number;
};

export function createGeminiClient(input: CreateGeminiClientInput): GeminiClient {
  if (!input.plantAiEnabled || !input.geminiApiKey?.trim()) {
    throw new AiDisabledError();
  }

  return new GeminiClient(input.geminiApiKey.trim(), input.geminiModel, {
    maxImageBytes: input.maxImageBytes,
    maxOutputTokens: input.maxOutputTokens,
    timeoutMs: input.timeoutMs,
  });
}

function safeUrlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid-url';
  }
}
