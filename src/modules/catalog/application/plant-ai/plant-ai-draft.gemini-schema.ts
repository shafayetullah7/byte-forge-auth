import { SchemaType, type ResponseSchema } from '@google/generative-ai';

const localeBlockSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  required: ['name'],
  properties: {
    name: { type: SchemaType.STRING },
    shortDescription: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
  },
};

const plantDetailsLocaleSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    commonNames: { type: SchemaType.STRING },
    origin: { type: SchemaType.STRING },
    soilType: { type: SchemaType.STRING },
    toxicityInfo: { type: SchemaType.STRING },
  },
};

const defaultVariantTitleLocaleSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  required: ['title'],
  properties: {
    title: { type: SchemaType.STRING },
  },
};

const careGuideLocaleSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    lightInstructions: { type: SchemaType.STRING },
    wateringInstructions: { type: SchemaType.STRING },
    humidityInstructions: { type: SchemaType.STRING },
    fertilizerSchedule: { type: SchemaType.STRING },
    repottingFrequency: { type: SchemaType.STRING },
    pruningNotes: { type: SchemaType.STRING },
    commonProblems: { type: SchemaType.STRING },
    seasonalCare: { type: SchemaType.STRING },
  },
};

/** Gemini `responseSchema` for structured plant draft JSON. */
export function buildPlantAiDraftGeminiResponseSchema(): ResponseSchema {
  return {
    type: SchemaType.OBJECT,
    required: ['translations', 'plantDetails', 'careGuide'],
    properties: {
      translations: {
        type: SchemaType.OBJECT,
        required: ['en', 'bn'],
        properties: {
          en: localeBlockSchema,
          bn: localeBlockSchema,
        },
      },
      plantDetails: {
        type: SchemaType.OBJECT,
        required: [
          'categoryId',
          'tagIds',
          'lightRequirement',
          'wateringFrequency',
          'humidityLevel',
          'careDifficulty',
          'translations',
        ],
        properties: {
          scientificName: { type: SchemaType.STRING },
          categoryId: { type: SchemaType.STRING },
          tagIds: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          lightRequirement: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['LOW', 'MEDIUM', 'BRIGHT_INDIRECT', 'DIRECT'],
          },
          wateringFrequency: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY'],
          },
          humidityLevel: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['LOW', 'MEDIUM', 'HIGH'],
          },
          careDifficulty: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['BEGINNER', 'INTERMEDIATE', 'EXPERT'],
          },
          growthRate: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['SLOW', 'MODERATE', 'FAST'],
          },
          temperatureRange: { type: SchemaType.STRING },
          matureHeight: { type: SchemaType.STRING },
          matureSpread: { type: SchemaType.STRING },
          translations: {
            type: SchemaType.OBJECT,
            required: ['en', 'bn'],
            properties: {
              en: plantDetailsLocaleSchema,
              bn: plantDetailsLocaleSchema,
            },
          },
        },
      },
      careGuide: {
        type: SchemaType.OBJECT,
        required: ['en', 'bn'],
        properties: {
          en: careGuideLocaleSchema,
          bn: careGuideLocaleSchema,
        },
      },
      defaultVariant: {
        type: SchemaType.OBJECT,
        required: ['growthStage', 'plantForm', 'translations'],
        properties: {
          growthStage: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['SEEDLING', 'JUVENILE', 'MATURE', 'CUTTING'],
          },
          plantForm: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['UPRIGHT', 'TRAILING', 'BUSHY', 'CLIMBING', 'ROSETTE'],
          },
          propagationType: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: [
              'CUTTING',
              'SEED',
              'TISSUE_CULTURE',
              'AIR_LAYER',
              'DIVISION',
            ],
          },
          containerType: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: [
              'NURSERY_POT',
              'DECORATIVE_POT',
              'HANGING_BASKET',
              'TERRARIUM',
              'GROW_BAG',
            ],
          },
          translations: {
            type: SchemaType.OBJECT,
            required: ['en', 'bn'],
            properties: {
              en: defaultVariantTitleLocaleSchema,
              bn: defaultVariantTitleLocaleSchema,
            },
          },
        },
      },
    },
  };
}
