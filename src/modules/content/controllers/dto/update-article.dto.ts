import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/common/schemas/slug.schema';
import { articleTranslationsSchema } from './create-article.dto';

export const updateArticleSchema = z.object({
  slug: SlugSchema.optional(),
  coverImageId: z.string().uuid().optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  readMinutes: z.coerce.number().int().min(1).max(999).optional().nullable(),
  translations: articleTranslationsSchema.partial().optional(),
});

export class UpdateArticleDto extends createZodDto(updateArticleSchema) {}
