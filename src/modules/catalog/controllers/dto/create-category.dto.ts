import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/common/schemas/slug.schema';

const translationSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
});

const createCategorySchema = z.object({
  slug: SlugSchema,
  parentId: z.string().uuid('Invalid UUID for parent ID').optional(),
  isActive: z.boolean().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  translations: z
    .array(translationSchema)
    .min(1, 'At least one translation is required'),
});

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
