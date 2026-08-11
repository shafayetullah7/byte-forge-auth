import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';

export const listPublicShopsQuerySchema = PaginationParamsSchema.extend({
  category: z.string().trim().optional(),
  sort: z
    .enum([
      'popular',
      'rating',
      'products',
      'followers',
      'engagement',
      'newest',
    ])
    .optional()
    .default('popular'),
}).transform((data) => ({
  ...data,
  sort:
    data.sort === 'followers' || data.sort === 'engagement'
      ? 'popular'
      : data.sort,
}));

export class ListPublicShopsQueryDto extends createZodDto(
  listPublicShopsQuerySchema,
) {}
