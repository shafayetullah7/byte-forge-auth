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
    readonly code?:
      | 'IMAGE_FETCH_FAILED'
      | 'IMAGE_TOO_LARGE'
      | 'INVALID_JSON'
      | 'EMPTY_RESPONSE'
      | 'REQUEST_FAILED'
      | 'RATE_LIMITED',
  ) {
    super(message);
    this.name = 'AiGenerationError';
  }
}
