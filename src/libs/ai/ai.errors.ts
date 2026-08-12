export class AiDisabledError extends Error {
  constructor(message = 'Plant AI is disabled') {
    super(message);
    this.name = 'AiDisabledError';
  }
}

export class AiGenerationError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AiGenerationError';
  }
}
