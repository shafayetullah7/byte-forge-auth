import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ProductStatusEnum, ProductTypeEnum } from '@/_db/drizzle/enum';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';

export const listProductsQuerySchema = PaginationParamsSchema.extend({
  productType: z.nativeEnum(ProductTypeEnum).optional(),
  status: z.nativeEnum(ProductStatusEnum).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'price', 'inventory'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class ListProductsQueryDto extends createZodDto(
  listProductsQuerySchema,
) {}
