import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/common/schemas/slug.schema';

const createTagSchema = z.object({
  groupId: z.uuid('Invalid UUID for group ID'),
  slug: SlugSchema,
  isActive: z.boolean().optional(),
  translations: z
    .array(
      z.object({
        locale: z.enum(['en', 'bn']),
        name: z.string().trim().min(1, 'Name is required').max(255),
        description: z.string().optional(),
      }),
    )
    .min(2, 'Translations for both English and Bengali are required')
    .max(2, 'Only English and Bengali translations are allowed')
    .superRefine((translations, ctx) => {
      const locales = translations.map((t) => t.locale);
      if (!locales.includes('en')) {
        ctx.addIssue({
          code: 'custom',
          message: 'English (en) translation is missing',
          path: [],
        });
      }
      if (!locales.includes('bn')) {
        ctx.addIssue({
          code: 'custom',
          message: 'Bengali (bn) translation is missing',
          path: [],
        });
      }
    }),
});

export class CreateTagDto extends createZodDto(createTagSchema) {}
