import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HttpStatus } from '@nestjs/common';
import { ZodError } from 'zod';
import { AiDisabledError, AiGenerationError } from '@/libs/ai/ai.errors';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { GeneratePlantAiDraftForSellerCommand } from './generate-plant-ai-draft-for-seller.command';
import { GeneratePlantAiDraftCommand } from './generate-plant-ai-draft.command';
import { PlantAiRateLimiterService } from './plant-ai-rate-limiter.service';
import { ValidatePlantAiThumbnailQuery } from './validate-plant-ai-thumbnail.query';

const monsteraFixture = JSON.parse(
  readFileSync(
    join(__dirname, '__fixtures__', 'plant-ai-draft.monstera.json'),
    'utf8',
  ),
);

describe('GeneratePlantAiDraftForSellerCommand', () => {
  const rateLimiter = {
    assertWithinLimit: jest.fn(),
  };

  const validateThumbnail = {
    execute: jest.fn(),
  };

  const generatePlantAiDraft = {
    execute: jest.fn(),
  };

  const i18n = {
    t: jest.fn((key: string) => key),
  };

  let command: GeneratePlantAiDraftForSellerCommand;

  beforeEach(() => {
    jest.clearAllMocks();
    command = new GeneratePlantAiDraftForSellerCommand(
      rateLimiter as unknown as PlantAiRateLimiterService,
      validateThumbnail as unknown as ValidatePlantAiThumbnailQuery,
      generatePlantAiDraft as unknown as GeneratePlantAiDraftCommand,
      i18n as never,
    );
    generatePlantAiDraft.execute.mockResolvedValue(monsteraFixture);
  });

  it('resolves thumbnail and passes imageUrl to generate command', async () => {
    validateThumbnail.execute.mockResolvedValue({
      imageUrl: 'https://cdn.example/plant.jpg',
    });

    await command.execute({
      shopId: 'shop-1',
      userId: 'user-1',
      lang: 'en',
      request: {
        scientificName: 'Monstera deliciosa',
        thumbnailMediaId: '11111111-1111-4111-8111-111111111111',
      },
    });

    expect(validateThumbnail.execute).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'user-1',
      'en',
    );
    expect(generatePlantAiDraft.execute).toHaveBeenCalledWith(
      {
        scientificName: 'Monstera deliciosa',
        thumbnailMediaId: '11111111-1111-4111-8111-111111111111',
      },
      { imageUrl: 'https://cdn.example/plant.jpg' },
    );
  });

  it('maps AiDisabledError to 503 CustomException', async () => {
    generatePlantAiDraft.execute.mockRejectedValue(new AiDisabledError());

    await expect(
      command.execute({
        shopId: 'shop-1',
        userId: 'user-1',
        lang: 'en',
        request: { scientificName: 'Monstera deliciosa' },
      }),
    ).rejects.toMatchObject({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    });
  });

  it('maps ZodError to 422 CustomException', async () => {
    generatePlantAiDraft.execute.mockRejectedValue(
      new ZodError([
        {
          code: 'custom',
          message: 'categoryId is not in the allowed category list',
          path: ['plantDetails', 'categoryId'],
        },
      ]),
    );

    await expect(
      command.execute({
        shopId: 'shop-1',
        userId: 'user-1',
        lang: 'en',
        request: { scientificName: 'Monstera deliciosa' },
      }),
    ).rejects.toMatchObject({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it('maps AiGenerationError to 502 CustomException', async () => {
    generatePlantAiDraft.execute.mockRejectedValue(
      new AiGenerationError('Gemini request failed'),
    );

    await expect(
      command.execute({
        shopId: 'shop-1',
        userId: 'user-1',
        lang: 'en',
        request: { scientificName: 'Monstera deliciosa' },
      }),
    ).rejects.toMatchObject({
      statusCode: HttpStatus.BAD_GATEWAY,
    });
  });
});
