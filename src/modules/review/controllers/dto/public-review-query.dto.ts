import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const publicReviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export class PublicReviewQueryDto extends createZodDto(
  publicReviewQuerySchema,
) {}
