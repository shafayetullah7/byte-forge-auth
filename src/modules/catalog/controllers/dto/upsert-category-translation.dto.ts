import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const upsertCategoryTranslationSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
});

export class UpsertCategoryTranslationDto extends createZodDto(
  upsertCategoryTranslationSchema,
) {}
