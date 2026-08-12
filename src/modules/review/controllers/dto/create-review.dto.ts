import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createReviewSchema = z.object({
  orderItemId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(255).optional().nullable(),
  comment: z.string().trim().max(3000).optional().nullable(),
});

export class CreateReviewDto extends createZodDto(createReviewSchema) {}
