import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getTagByIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Tag ID must be a valid UUID' }),
});

export class GetTagByIdParamsDto extends createZodDto(getTagByIdParamsSchema) {}
