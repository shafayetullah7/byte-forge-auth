import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const categoryParamSchema = z.object({
  id: z.string().uuid({ message: 'Must be a valid UUID format' }),
});

export class CategoryParamDto extends createZodDto(categoryParamSchema) {}
