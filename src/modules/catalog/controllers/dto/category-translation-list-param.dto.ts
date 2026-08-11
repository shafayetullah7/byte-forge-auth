import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const categoryTranslationListParamSchema = z.object({
  category_id: z.string().uuid({ message: 'Must be a valid UUID format' }),
});

export class CategoryTranslationListParamDto extends createZodDto(
  categoryTranslationListParamSchema,
) {}
