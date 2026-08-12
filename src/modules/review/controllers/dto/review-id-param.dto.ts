import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const reviewIdParamSchema = z.object({
  reviewId: z.string().uuid(),
});

export class ReviewIdParamDto extends createZodDto(reviewIdParamSchema) {}
