import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const categoryTranslationParamSchema = z.object({
  category_id: z.string().uuid(),
  locale: z.string().min(2).max(10),
});

export class CategoryTranslationParamDto extends createZodDto(
  categoryTranslationParamSchema,
) {}
