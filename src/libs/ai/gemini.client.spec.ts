import { AiDisabledError } from './ai.errors';
import { createGeminiClient } from './gemini.client';

describe('createGeminiClient', () => {
  it('throws AiDisabledError when feature flag is off', () => {
    expect(() =>
      createGeminiClient({
        plantAiEnabled: false,
        geminiApiKey: 'test-key',
        geminiModel: 'gemini-2.0-flash',
      }),
    ).toThrow(AiDisabledError);
  });

  it('throws AiDisabledError when api key is missing', () => {
    expect(() =>
      createGeminiClient({
        plantAiEnabled: true,
        geminiModel: 'gemini-2.0-flash',
      }),
    ).toThrow(AiDisabledError);
  });
});
