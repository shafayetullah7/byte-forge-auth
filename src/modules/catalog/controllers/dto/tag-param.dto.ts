import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const tagParamSchema = z.object({
  tagId: z.uuid({ message: 'Must be a valid UUID format' }),
});

export class TagParamDto extends createZodDto(tagParamSchema) {}
