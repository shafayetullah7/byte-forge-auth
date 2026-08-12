import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AiDisabledError, AiGenerationError } from '@/libs/ai/ai.errors';
import type { GeminiClient } from '@/libs/ai/gemini.client';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { BuildPlantAiContextQuery } from './build-plant-ai-context.query';
import { GeneratePlantAiDraftCommand } from './generate-plant-ai-draft.command';

const monsteraFixture = JSON.parse(
  readFileSync(
    join(__dirname, '__fixtures__', 'plant-ai-draft.monstera.json'),
    'utf8',
  ),
);

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const TAG_ID = '22222222-2222-4222-8222-222222222222';

describe('GeneratePlantAiDraftCommand', () => {
  const appConfig = {
    isPlantAiEnabled: false,
    geminiApiKey: undefined,
    geminiModel: 'gemini-3.6-flash',
  };

  const buildPlantAiContext = {
    execute: jest.fn(),
  };

  let command: GeneratePlantAiDraftCommand;

  beforeEach(() => {
    jest.clearAllMocks();
    command = new GeneratePlantAiDraftCommand(
      appConfig as unknown as AppConfigService,
      buildPlantAiContext as unknown as BuildPlantAiContextQuery,
    );

    buildPlantAiContext.execute.mockResolvedValue({
      categories: [
        {
          id: CATEGORY_ID,
          slug: 'indoor',
          nameEn: 'Indoor',
          nameBn: 'ইনডোর',
        },
      ],
      tags: [
        {
          id: TAG_ID,
          slug: 'foliage',
          groupSlug: 'type',
          nameEn: 'Foliage',
          nameBn: 'পাতা',
        },
      ],
      enums: {
        lightRequirement: ['BRIGHT_INDIRECT'],
        wateringFrequency: ['WEEKLY'],
        humidityLevel: ['MEDIUM'],
        careDifficulty: ['BEGINNER'],
        growthRate: ['MODERATE'],
        growthStage: ['JUVENILE'],
        plantForm: ['CLIMBING'],
        propagationType: ['CUTTING'],
        containerType: ['NURSERY_POT'],
      },
    });
  });

  it('throws AiDisabledError when feature is off and no client injected', async () => {
    await expect(
      command.execute({ scientificName: 'Monstera deliciosa' }),
    ).rejects.toThrow(AiDisabledError);
  });

  it('returns validated draft using mocked Gemini client', async () => {
    const geminiClient = {
      generateJson: jest.fn().mockResolvedValue(monsteraFixture),
    } as unknown as GeminiClient;

    const result = await command.execute(
      { scientificName: 'Monstera deliciosa' },
      { geminiClient },
    );

    expect(geminiClient.generateJson).toHaveBeenCalled();
    expect(result.translations.en.name).toBe('Monstera');
    expect(result.plantDetails.categoryId).toBe(CATEGORY_ID);
  });

  it('rejects hallucinated categoryId from mocked Gemini output', async () => {
    const invalidCategoryId = '99999999-9999-4999-8999-999999999999';
    const geminiClient = {
      generateJson: jest.fn().mockResolvedValue({
        ...monsteraFixture,
        plantDetails: {
          ...monsteraFixture.plantDetails,
          categoryId: invalidCategoryId,
        },
      }),
    } as unknown as GeminiClient;

    await expect(
      command.execute({ scientificName: 'Monstera deliciosa' }, { geminiClient }),
    ).rejects.toMatchObject({
      issues: [
        expect.objectContaining({
          message: expect.stringContaining('categoryId'),
        }),
      ],
    });
  });

  it('retries once when Gemini returns invalid JSON', async () => {
    const geminiClient = {
      generateJson: jest
        .fn()
        .mockRejectedValueOnce(
          new AiGenerationError('Gemini returned invalid JSON', undefined, 'INVALID_JSON'),
        )
        .mockResolvedValueOnce(monsteraFixture),
    } as unknown as GeminiClient;

    const result = await command.execute(
      { scientificName: 'Monstera deliciosa' },
      { geminiClient },
    );

    expect(geminiClient.generateJson).toHaveBeenCalledTimes(2);
    expect(result.translations.en.name).toBe('Monstera');
  });

  it('does not retry when Gemini returns rate limited', async () => {
    const geminiClient = {
      generateJson: jest
        .fn()
        .mockRejectedValue(
          new AiGenerationError('Gemini rate limit exceeded', undefined, 'RATE_LIMITED'),
        ),
    } as unknown as GeminiClient;

    await expect(
      command.execute({ scientificName: 'Monstera deliciosa' }, { geminiClient }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' });

    expect(geminiClient.generateJson).toHaveBeenCalledTimes(1);
  });

  it('retries when Gemini model is overloaded', async () => {
    jest.useFakeTimers();
    const geminiClient = {
      generateJson: jest
        .fn()
        .mockRejectedValueOnce(
          new AiGenerationError(
            'Gemini model is temporarily overloaded',
            undefined,
            'MODEL_OVERLOADED',
          ),
        )
        .mockResolvedValueOnce(monsteraFixture),
    } as unknown as GeminiClient;

    const resultPromise = command.execute(
      { scientificName: 'Monstera deliciosa' },
      { geminiClient },
    );

    await jest.runAllTimersAsync();
    const result = await resultPromise;

    expect(geminiClient.generateJson).toHaveBeenCalledTimes(2);
    expect(result.translations.en.name).toBe('Monstera');
    jest.useRealTimers();
  });
});
