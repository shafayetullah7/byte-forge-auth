import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';
import { OrderStatusEnum, PaymentStatusEnum } from '@/_db/drizzle/enum';

export const SellerOrdersFilterSchema = PaginationParamsSchema.extend({
  sortBy: z.enum(['createdAt', 'total']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  orderStatus: z.nativeEnum(OrderStatusEnum).optional(),
  paymentStatus: z.nativeEnum(PaymentStatusEnum).optional(),
  search: z.string().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
});

export class SellerOrdersFilterDto extends createZodDto(
  SellerOrdersFilterSchema,
) {}

export const OrderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});

export class OrderIdParamDto extends createZodDto(OrderIdParamSchema) {}
