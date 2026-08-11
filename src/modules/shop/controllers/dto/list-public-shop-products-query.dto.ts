import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';

export const listPublicShopProductsQuerySchema = PaginationParamsSchema.extend({
  sort: z
    .enum(['popular', 'price_asc', 'price_desc', 'newest', 'rating'])
    .optional()
    .default('popular'),
});

export class ListPublicShopProductsQueryDto extends createZodDto(
  listPublicShopProductsQuerySchema,
) {}
