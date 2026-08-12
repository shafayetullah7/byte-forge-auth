import { z } from 'zod';
import {
  CareDifficultyEnum,
  GrowthRateEnum,
  HumidityLevelEnum,
  LightRequirementEnum,
  WateringFrequencyEnum,
} from '@/_db/drizzle/enum/plant-care.enum';
import {
  ContainerTypeEnum,
  GrowthStageEnum,
  PlantFormEnum,
  PropagationTypeEnum,
} from '@/_db/drizzle/enum/plant-variant.enum';

const localeBlockSchema = z.object({
  name: z.string().trim().min(3).max(255),
  shortDescription: z.string().trim().max(500).optional(),
  description: z.string().trim().max(5000).optional(),
});

const plantDetailsLocaleSchema = z.object({
  commonNames: z.string().trim().max(500).optional(),
  origin: z.string().trim().max(255).optional(),
  soilType: z.string().trim().max(255).optional(),
  toxicityInfo: z.string().trim().max(1000).optional(),
});

const careGuideLocaleSchema = z.object({
  lightInstructions: z.string().trim().max(5000).optional(),
  wateringInstructions: z.string().trim().max(5000).optional(),
  humidityInstructions: z.string().trim().max(5000).optional(),
  fertilizerSchedule: z.string().trim().max(5000).optional(),
  repottingFrequency: z.string().trim().max(5000).optional(),
  pruningNotes: z.string().trim().max(5000).optional(),
  commonProblems: z.string().trim().max(5000).optional(),
  seasonalCare: z.string().trim().max(5000).optional(),
});

const lightRequirementSchema = z.enum(
  Object.keys(LightRequirementEnum) as [
    keyof typeof LightRequirementEnum,
    ...Array<keyof typeof LightRequirementEnum>,
  ],
);

const wateringFrequencySchema = z.enum(
  Object.keys(WateringFrequencyEnum) as [
    keyof typeof WateringFrequencyEnum,
    ...Array<keyof typeof WateringFrequencyEnum>,
  ],
);

const humidityLevelSchema = z.enum(
  Object.keys(HumidityLevelEnum) as [
    keyof typeof HumidityLevelEnum,
    ...Array<keyof typeof HumidityLevelEnum>,
  ],
);

const careDifficultySchema = z.enum(
  Object.keys(CareDifficultyEnum) as [
    keyof typeof CareDifficultyEnum,
    ...Array<keyof typeof CareDifficultyEnum>,
  ],
);

const growthRateSchema = z.enum(
  Object.keys(GrowthRateEnum) as [
    keyof typeof GrowthRateEnum,
    ...Array<keyof typeof GrowthRateEnum>,
  ],
);

const growthStageSchema = z.enum(
  Object.keys(GrowthStageEnum) as [
    keyof typeof GrowthStageEnum,
    ...Array<keyof typeof GrowthStageEnum>,
  ],
);

const plantFormSchema = z.enum(
  Object.keys(PlantFormEnum) as [
    keyof typeof PlantFormEnum,
    ...Array<keyof typeof PlantFormEnum>,
  ],
);

const propagationTypeSchema = z.enum(
  Object.keys(PropagationTypeEnum) as [
    keyof typeof PropagationTypeEnum,
    ...Array<keyof typeof PropagationTypeEnum>,
  ],
);

const containerTypeSchema = z.enum(
  Object.keys(ContainerTypeEnum) as [
    keyof typeof ContainerTypeEnum,
    ...Array<keyof typeof ContainerTypeEnum>,
  ],
);

const defaultVariantSchema = z.object({
  growthStage: growthStageSchema,
  plantForm: plantFormSchema,
  propagationType: propagationTypeSchema.optional(),
  containerType: containerTypeSchema.optional(),
  translations: z.object({
    en: z.object({
      title: z.string().trim().min(1).max(255),
    }),
    bn: z.object({
      title: z.string().trim().min(1).max(255),
    }),
  }),
});

export const plantAiDraftRequestSchema = z
  .object({
    plantName: z.string().trim().max(255).optional(),
    scientificName: z.string().trim().max(255).optional(),
    thumbnailMediaId: z.string().uuid().optional(),
    localeHint: z.enum(['en', 'bn']).optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.plantName?.trim() ||
          data.scientificName?.trim() ||
          data.thumbnailMediaId,
      ),
    {
      message:
        'At least one of plantName, scientificName, or thumbnailMediaId is required',
    },
  );

export const plantAiDraftResponseSchema = z.object({
  translations: z.object({
    en: localeBlockSchema,
    bn: localeBlockSchema,
  }),
  plantDetails: z.object({
    scientificName: z.string().trim().max(255).optional(),
    categoryId: z.string().uuid(),
    tagIds: z.array(z.string().uuid()).max(20).default([]),
    lightRequirement: lightRequirementSchema,
    wateringFrequency: wateringFrequencySchema,
    humidityLevel: humidityLevelSchema,
    careDifficulty: careDifficultySchema,
    growthRate: growthRateSchema.optional(),
    temperatureRange: z.string().trim().max(100).optional(),
    matureHeight: z.string().trim().max(50).optional(),
    matureSpread: z.string().trim().max(50).optional(),
    translations: z.object({
      en: plantDetailsLocaleSchema,
      bn: plantDetailsLocaleSchema,
    }),
  }),
  careGuide: z.object({
    en: careGuideLocaleSchema,
    bn: careGuideLocaleSchema,
  }),
  defaultVariant: defaultVariantSchema.optional(),
});

export type PlantAiDraftRequest = z.infer<typeof plantAiDraftRequestSchema>;
export type PlantAiDraftResponse = z.infer<typeof plantAiDraftResponseSchema>;

export type PlantAiDraftAllowlists = {
  categoryIds: ReadonlySet<string>;
  tagIds: ReadonlySet<string>;
};

export function parsePlantAiDraftRequest(data: unknown): PlantAiDraftRequest {
  return plantAiDraftRequestSchema.parse(data);
}

export function parsePlantAiDraftResponse(
  data: unknown,
  allowlists: PlantAiDraftAllowlists,
): PlantAiDraftResponse {
  const draft = plantAiDraftResponseSchema.parse(data);

  if (!allowlists.categoryIds.has(draft.plantDetails.categoryId)) {
    throw new z.ZodError([
      {
        code: 'custom',
        message: 'categoryId is not in the allowed category list',
        path: ['plantDetails', 'categoryId'],
      },
    ]);
  }

  for (let i = 0; i < draft.plantDetails.tagIds.length; i++) {
    const tagId = draft.plantDetails.tagIds[i];
    if (!allowlists.tagIds.has(tagId)) {
      throw new z.ZodError([
        {
          code: 'custom',
          message: 'tagId is not in the allowed tag list',
          path: ['plantDetails', 'tagIds', i],
        },
      ]);
    }
  }

  return draft;
}
