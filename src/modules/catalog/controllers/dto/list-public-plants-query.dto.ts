import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';
import {
  CareDifficultyEnum,
  LightRequirementEnum,
  WateringFrequencyEnum,
  HumidityLevelEnum,
  GrowthRateEnum,
} from '@/_db/drizzle/enum';

export const listPlantsQuerySchema = PaginationParamsSchema.extend({
  categoryId: z.string().uuid({ message: 'Invalid category UUID' }).optional(),
  tagIds: z
    .string()
    .transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().uuid({ message: 'Invalid tag UUID' })).max(10))
    .optional(),
  careDifficulty: z
    .enum(Object.keys(CareDifficultyEnum) as [string, ...string[]])
    .optional(),
  lightRequirement: z
    .enum(Object.keys(LightRequirementEnum) as [string, ...string[]])
    .optional(),
  wateringFrequency: z
    .enum(Object.keys(WateringFrequencyEnum) as [string, ...string[]])
    .optional(),
  humidityLevel: z
    .enum(Object.keys(HumidityLevelEnum) as [string, ...string[]])
    .optional(),
  growthRate: z
    .enum(Object.keys(GrowthRateEnum) as [string, ...string[]])
    .optional(),
  minPrice: z.coerce
    .number()
    .nonnegative('Min price cannot be negative')
    .optional(),
  maxPrice: z.coerce
    .number()
    .nonnegative('Max price cannot be negative')
    .optional(),
  inStockOnly: z.coerce.boolean().optional().default(false),
  sortBy: z
    .enum(['name', 'price', 'difficulty', 'inventory', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class ListPublicPlantsQueryDto extends createZodDto(
  listPlantsQuerySchema,
) {}
