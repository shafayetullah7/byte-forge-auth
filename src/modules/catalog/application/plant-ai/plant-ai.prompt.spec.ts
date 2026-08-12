import { isPhotoOnlyPlantAiRequest } from './plant-ai-request.util';
import { buildPlantAiUserPrompt } from './plant-ai.prompt';

const context = {
  categories: [{ id: 'cat-1', slug: 'indoor', nameEn: 'Indoor', nameBn: 'ইনডোর' }],
  tags: [],
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
};

describe('isPhotoOnlyPlantAiRequest', () => {
  it('is true when only thumbnail is provided', () => {
    expect(
      isPhotoOnlyPlantAiRequest({
        thumbnailMediaId: '11111111-1111-4111-8111-111111111111',
      }),
    ).toBe(true);
  });

  it('is false when plant name is provided', () => {
    expect(
      isPhotoOnlyPlantAiRequest({
        thumbnailMediaId: '11111111-1111-4111-8111-111111111111',
        plantName: 'Monstera',
      }),
    ).toBe(false);
  });
});

describe('buildPlantAiUserPrompt', () => {
  it('includes photo-only identification instructions', () => {
    const prompt = buildPlantAiUserPrompt(
      { thumbnailMediaId: '11111111-1111-4111-8111-111111111111' },
      context,
    );

    expect(prompt).toContain('Photo-only input');
    expect(prompt).toContain('Identify the plant');
    expect(prompt).toContain('Default variant');
  });
});
