import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const articleIdParamSchema = z.object({
  id: z.string().uuid('Invalid article ID format'),
});

export class ArticleIdParamDto extends createZodDto(articleIdParamSchema) {}
