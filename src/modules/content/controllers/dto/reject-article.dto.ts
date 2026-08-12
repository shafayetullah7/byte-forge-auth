import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RejectArticleSchema = z.object({
  reason: z.string().trim().min(10, {
    message: 'Rejection reason must be at least 10 characters',
  }),
});

export class RejectArticleDto extends createZodDto(RejectArticleSchema) {}
