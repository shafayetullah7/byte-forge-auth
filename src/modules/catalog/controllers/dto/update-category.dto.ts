import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/common/schemas/slug.schema';

const translationSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
});

const updateCategorySchema = z.object({
  slug: SlugSchema.optional(),
  parentId: z.string().uuid('Invalid UUID for parent ID').optional(),
  isActive: z.boolean().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  translations: z.array(translationSchema).optional(),
});

export class UpdateCategoryDto extends createZodDto(updateCategorySchema) {}
