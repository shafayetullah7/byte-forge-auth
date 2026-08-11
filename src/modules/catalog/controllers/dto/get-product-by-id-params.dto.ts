import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getProductByIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Product ID must be a valid UUID' }),
});

export class GetProductByIdParamsDto extends createZodDto(
  getProductByIdParamsSchema,
) {}
