import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getCategoryByIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Category ID must be a valid UUID' }),
});

export class GetCategoryByIdParamsDto extends createZodDto(
  getCategoryByIdParamsSchema,
) {}
