import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/libs/schemas/pagination.schema';
import { OrderStatusEnum, PaymentStatusEnum } from '@/_db/drizzle/enum';

export const AdminOrdersQuerySchema = PaginationParamsSchema.extend({
  sortBy: z.enum(['createdAt', 'total']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  shopId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.nativeEnum(OrderStatusEnum).optional(),
  paymentStatus: z.nativeEnum(PaymentStatusEnum).optional(),
  search: z.string().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
});

export class AdminOrdersQueryDto extends createZodDto(AdminOrdersQuerySchema) {}

export const AdminOrderStatsQuerySchema = z.object({
  shopId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export class AdminOrderStatsQueryDto extends createZodDto(
  AdminOrderStatsQuerySchema,
) {}

export const AdminOrderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});

export class AdminOrderIdParamDto extends createZodDto(
  AdminOrderIdParamSchema,
) {}
