import { SchemaType } from '@google/generative-ai';
import { AiDisabledError, AiGenerationError } from './ai.errors';
import { GeminiClient, createGeminiClient } from './gemini.client';

describe('createGeminiClient', () => {
  it('throws AiDisabledError when feature flag is off', () => {
    expect(() =>
      createGeminiClient({
        plantAiEnabled: false,
        geminiApiKey: 'test-key',
        geminiModel: 'gemini-3.6-flash',
      }),
    ).toThrow(AiDisabledError);
  });

  it('throws AiDisabledError when api key is missing', () => {
    expect(() =>
      createGeminiClient({
        plantAiEnabled: true,
        geminiModel: 'gemini-3.6-flash',
      }),
    ).toThrow(AiDisabledError);
  });
});

describe('GeminiClient image fetch', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('throws IMAGE_FETCH_FAILED when Cloudinary fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => 'image/jpeg' },
    }) as unknown as typeof fetch;

    const client = new GeminiClient('test-key', 'gemini-3.6-flash');

    await expect(
      client.generateJson({
        systemInstruction: 'test',
        userText: 'test',
        imageUrl: 'https://cdn.example/missing.jpg',
        responseSchema: { type: SchemaType.OBJECT, properties: {} },
      }),
    ).rejects.toMatchObject({
      code: 'IMAGE_FETCH_FAILED',
    });
  });

  it('throws IMAGE_TOO_LARGE when downloaded bytes exceed limit', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => new ArrayBuffer(2 * 1024 * 1024),
    }) as unknown as typeof fetch;

    const client = new GeminiClient('test-key', 'gemini-3.6-flash', {
      maxImageBytes: 1024,
    });

    await expect(
      client.generateJson({
        systemInstruction: 'test',
        userText: 'test',
        imageUrl: 'https://cdn.example/large.jpg',
        responseSchema: { type: SchemaType.OBJECT, properties: {} },
      }),
    ).rejects.toBeInstanceOf(AiGenerationError);
  });
});
