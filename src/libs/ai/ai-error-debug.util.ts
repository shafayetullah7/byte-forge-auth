import { AiGenerationError } from './ai.errors';

/** Safe structured error detail for logs (never includes API keys). */
export function formatAiErrorForLog(error: unknown): Record<string, unknown> {
  if (error instanceof AiGenerationError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      cause: error.cause ? formatAiErrorForLog(error.cause) : undefined,
    };
  }

  if (error instanceof Error) {
    const extra = error as Error & {
      status?: number;
      statusText?: string;
      errorDetails?: unknown;
    };

    return {
      name: error.name,
      message: error.message,
      status: extra.status,
      statusText: extra.statusText,
      errorDetails: extra.errorDetails,
    };
  }

  return { value: String(error) };
}

export function plantAiDebugLog(
  _scope: string,
  _step: string,
  _detail?: Record<string, unknown>,
): void {
  // console.log(
  //   `[PlantAi debug][${scope}] ${step}`,
  //   detail ? JSON.stringify(detail) : '',
  // );
}
