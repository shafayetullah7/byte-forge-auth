import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const removeReviewSchema = z.object({
  reason: z.string().trim().min(3).max(2000),
});

export class RemoveReviewDto extends createZodDto(removeReviewSchema) {}
