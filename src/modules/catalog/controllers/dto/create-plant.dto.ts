import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  ProductStatusEnum,
  LightRequirementEnum,
  WateringFrequencyEnum,
  HumidityLevelEnum,
  CareDifficultyEnum,
  GrowthRateEnum,
  GrowthStageEnum,
  PlantFormEnum,
  LeafDensityEnum,
  VariegationEnum,
  PropagationTypeEnum,
  ContainerTypeEnum,
} from '@/_db/drizzle/enum';

// === Reusable Schemas ===
export const SlugSchema = z
  .string()
  .trim()
  .min(3, 'Slug must be at least 3 characters')
  .max(255, 'Slug must be at most 255 characters')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase alphanumeric with hyphens only',
  )
  .optional();

export const UUIDSchema = z.string().uuid({ message: 'Invalid UUID format' });

export const LocaleSchema = z.enum(['en', 'bn']);

// === Product Translation Schema ===
export const productTranslationSchema = z.object({
  locale: LocaleSchema,
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be at most 255 characters'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),
  shortDescription: z
    .string()
    .trim()
    .max(500, 'Short description must be at most 500 characters')
    .optional(),
});

// === Plant Details Translation Schema ===
export const plantDetailsTranslationSchema = z.object({
  commonNames: z
    .string()
    .trim()
    .max(500, 'Common names must be at most 500 characters')
    .optional(),
  origin: z
    .string()
    .trim()
    .max(255, 'Origin must be at most 255 characters')
    .optional(),
  soilType: z
    .string()
    .trim()
    .max(255, 'Soil type must be at most 255 characters')
    .optional(),
  toxicityInfo: z
    .string()
    .trim()
    .max(1000, 'Toxicity info must be at most 1000 characters')
    .optional(),
});

// === Plant Details Schema ===
export const plantDetailsSchema = z.object({
  categoryId: UUIDSchema.refine((val) => val, {
    message: 'Category ID is required',
  }),
  tagIds: z.array(UUIDSchema).max(20, 'Maximum 20 tags allowed').optional(),
  scientificName: z
    .string()
    .trim()
    .max(255, 'Scientific name must be at most 255 characters')
    .optional(),
  lightRequirement: z.enum(
    Object.keys(LightRequirementEnum) as [string, ...string[]],
  ),
  wateringFrequency: z.enum(
    Object.keys(WateringFrequencyEnum) as [string, ...string[]],
  ),
  humidityLevel: z.enum(
    Object.keys(HumidityLevelEnum) as [string, ...string[]],
  ),
  temperatureRange: z
    .string()
    .trim()
    .max(100, 'Temperature range must be at most 100 characters')
    .optional(),
  careDifficulty: z.enum(
    Object.keys(CareDifficultyEnum) as [string, ...string[]],
  ),
  growthRate: z
    .enum(Object.keys(GrowthRateEnum) as [string, ...string[]])
    .optional(),
  matureHeight: z
    .string()
    .trim()
    .max(100, 'Mature height must be at most 100 characters')
    .optional(),
  matureSpread: z
    .string()
    .trim()
    .max(100, 'Mature spread must be at most 100 characters')
    .optional(),
  translations: z.object({
    en: plantDetailsTranslationSchema,
    bn: plantDetailsTranslationSchema,
  }),
});

// === Variant Translation Schema ===
export const variantTranslationSchema = z.object({
  title: z
    .string()
    .trim()
    .max(255, 'Title must be at most 255 characters')
    .optional(),
});

// === Plant Variant Attributes Schema ===
export const plantVariantAttributesSchema = z.object({
  growthStage: z
    .enum(Object.keys(GrowthStageEnum) as [string, ...string[]])
    .optional()
    .default('juvenile'),
  plantForm: z
    .enum(Object.keys(PlantFormEnum) as [string, ...string[]])
    .optional()
    .default('upright'),
  variegation: z
    .enum(Object.keys(VariegationEnum) as [string, ...string[]])
    .optional()
    .default('none'),
  leafDensity: z
    .enum(Object.keys(LeafDensityEnum) as [string, ...string[]])
    .optional()
    .default('moderate'),
  stemCount: z
    .number()
    .int()
    .nonnegative('Stem count cannot be negative')
    .optional()
    .default(1),
  currentHeight: z
    .string()
    .trim()
    .max(50, 'Current height must be at most 50 characters')
    .optional(),
  currentSpread: z
    .string()
    .trim()
    .max(50, 'Current spread must be at most 50 characters')
    .optional(),
  propagationType: z
    .enum(Object.keys(PropagationTypeEnum) as [string, ...string[]])
    .optional()
    .default('cutting'),
  containerType: z
    .enum(Object.keys(ContainerTypeEnum) as [string, ...string[]])
    .optional()
    .default('nursery_pot'),
  containerSize: z
    .string()
    .trim()
    .max(50, 'Container size must be at most 50 characters')
    .optional(),
  bundleType: z
    .string()
    .trim()
    .max(50, 'Bundle type must be at most 50 characters')
    .optional(),
});

// === Product Variant Schema ===
export const productVariantSchema = z.object({
  sku: z
    .string()
    .trim()
    .max(100, 'SKU must be at most 100 characters')
    .optional(),
  price: z
    .number({ message: 'Price is required' })
    .positive('Price must be greater than 0')
    .max(999999.99, 'Price must be at most 999999.99'),
  inventoryCount: z
    .number()
    .int()
    .nonnegative('Inventory cannot be negative')
    .optional()
    .default(0),
  trackInventory: z.boolean().optional().default(true),
  lowStockThreshold: z
    .number()
    .int()
    .nonnegative('Low stock threshold cannot be negative')
    .optional()
    .default(5),
  isBase: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  plantAttributes: plantVariantAttributesSchema.optional(),
  mediaIds: z
    .array(UUIDSchema)
    .max(10, 'Maximum 10 images per variant')
    .optional(),
  translations: z.object({
    en: variantTranslationSchema,
    bn: variantTranslationSchema,
  }),
});

// === Care Guide Schema ===
export const careGuideSchema = z.object({
  lightInstructions: z
    .string()
    .trim()
    .max(5000, 'Light instructions must be at most 5000 characters')
    .optional(),
  wateringInstructions: z
    .string()
    .trim()
    .max(5000, 'Watering instructions must be at most 5000 characters')
    .optional(),
  humidityInstructions: z
    .string()
    .trim()
    .max(5000, 'Humidity instructions must be at most 5000 characters')
    .optional(),
  fertilizerSchedule: z
    .string()
    .trim()
    .max(5000, 'Fertilizer schedule must be at most 5000 characters')
    .optional(),
  repottingFrequency: z
    .string()
    .trim()
    .max(5000, 'Repotting frequency must be at most 5000 characters')
    .optional(),
  pruningNotes: z
    .string()
    .trim()
    .max(5000, 'Pruning notes must be at most 5000 characters')
    .optional(),
  commonProblems: z
    .string()
    .trim()
    .max(5000, 'Common problems must be at most 5000 characters')
    .optional(),
  seasonalCare: z
    .string()
    .trim()
    .max(5000, 'Seasonal care must be at most 5000 characters')
    .optional(),
});

// === Main Create Plant Schema ===
export const createPlantSchema = z.object({
  // Basic Product Information
  slug: SlugSchema,
  thumbnailId: UUIDSchema.refine((val) => val, {
    message: 'Thumbnail ID is required',
  }),
  status: z
    .enum(Object.keys(ProductStatusEnum) as [string, ...string[]])
    .optional()
    .default('DRAFT'),

  // Translations (at least English required, no duplicate locales)
  translations: z
    .array(productTranslationSchema)
    .min(1, 'At least one translation is required')
    .refine(
      (data) => data.some((t) => t.locale === 'en'),
      'English translation is required',
    )
    .refine(
      (data) => new Set(data.map((t) => t.locale)).size === data.length,
      'Duplicate locales are not allowed',
    ),

  // Plant Details (Shared/ENUM fields + translations)
  plantDetails: plantDetailsSchema,

  // Variants (at least 1 required, exactly 1 must be marked as base, max 50 variants)
  variants: z
    .array(productVariantSchema)
    .min(1, 'At least one variant is required')
    .max(50, 'Maximum 50 variants allowed per product')
    .refine(
      (data) => data.filter((v) => v.isBase).length === 1,
      'Exactly one variant must be marked as base (isBase: true)',
    ),

  // Care Guide (EN and/or BN, both optional)
  careGuide: z
    .object({
      en: careGuideSchema.optional(),
      bn: careGuideSchema.optional(),
    })
    .optional(),
});

export class CreatePlantDto extends createZodDto(createPlantSchema) {}
