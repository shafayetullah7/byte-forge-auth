import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ProductStatusEnum } from '@/_db/drizzle/enum';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';

export const listPlantsQuerySchema = PaginationParamsSchema.extend({
  status: z.nativeEnum(ProductStatusEnum).optional(),
  categoryId: z.string().uuid().optional(),
  tagIds: z.string().uuid().array().max(10).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'price', 'inventory'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class ListPlantsQueryDto extends createZodDto(listPlantsQuerySchema) {}
