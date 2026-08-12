import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ReviewStatusEnum } from '@/_db/drizzle/enum';

const listBuyerReviewsQuerySchema = z.object({
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
});

export class ListBuyerReviewsQueryDto extends createZodDto(
  listBuyerReviewsQuerySchema,
) {}
