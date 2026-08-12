import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';

export const AdminUsersQuerySchema = PaginationParamsSchema.extend({
  sortBy: z.enum(['createdAt', 'name']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  buyersOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v !== 'false'),
});

export class AdminUsersQueryDto extends createZodDto(AdminUsersQuerySchema) {}

export const AdminUserIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export class AdminUserIdParamDto extends createZodDto(AdminUserIdParamSchema) {}
