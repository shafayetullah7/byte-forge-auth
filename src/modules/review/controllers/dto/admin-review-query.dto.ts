import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ReviewStatusEnum } from '@/_db/drizzle/enum';

const adminReviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
  status: z
    .enum([
      ReviewStatusEnum.PENDING,
      ReviewStatusEnum.APPROVED,
      ReviewStatusEnum.REJECTED,
    ])
    .optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
  reportedOnly: z.coerce.boolean().optional(),
  featuredOnly: z.coerce.boolean().optional(),
  removedOnly: z.coerce.boolean().optional(),
});

export class AdminReviewQueryDto extends createZodDto(adminReviewQuerySchema) {}
