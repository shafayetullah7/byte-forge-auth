import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/common/schemas/slug.schema';

const articleTranslationSchema = z.object({
  title: z.string().trim().min(1).max(255),
  excerpt: z.string().trim().optional().nullable(),
  body: z.string().trim().optional().nullable(),
});

export const articleTranslationsSchema = z.object({
  en: articleTranslationSchema,
  bn: articleTranslationSchema,
});

export const createArticleSchema = z.object({
  slug: SlugSchema.optional(),
  coverImageId: z.string().uuid().optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  readMinutes: z.coerce.number().int().min(1).max(999).optional().nullable(),
  translations: z.object({
    en: articleTranslationSchema,
    bn: articleTranslationSchema.optional(),
  }),
});

export class CreateArticleDto extends createZodDto(createArticleSchema) {}
