import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const upsertTagGroupTranslationSchema = z.object({
  locale: z.string().trim().min(2, 'Locale must be at least 2 chars').max(10), // e.g. 'en-US'
  name: z.string().trim().min(1, 'Name cannot be empty').max(255),
  description: z.string().optional(),
});

export class UpsertTagGroupTranslationDto extends createZodDto(
  upsertTagGroupTranslationSchema,
) {}
