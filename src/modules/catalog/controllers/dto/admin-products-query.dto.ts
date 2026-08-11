import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';
import { ProductStatusEnum, ProductTypeEnum } from '@/_db/drizzle/enum';

export const AdminProductsQuerySchema = PaginationParamsSchema.extend({
  shopId: z.string().uuid().optional(),
  status: z.nativeEnum(ProductStatusEnum).optional(),
  productType: z.nativeEnum(ProductTypeEnum).optional().default('plant'),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'price'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export class AdminProductsQueryDto extends createZodDto(
  AdminProductsQuerySchema,
) {}

export const AdminProductIdParamSchema = z.object({
  productId: z.string().uuid(),
});

export class AdminProductIdParamDto extends createZodDto(
  AdminProductIdParamSchema,
) {}

export const ArchiveProductSchema = z.object({
  reason: z.string().trim().min(3).max(2000).optional(),
});

export class ArchiveProductDto extends createZodDto(ArchiveProductSchema) {}
