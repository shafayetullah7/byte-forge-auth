import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';
import { OrderStatusEnum, PaymentStatusEnum } from '@/_db/drizzle/enum';

export const OrdersFilterSchema = PaginationParamsSchema.extend({
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  orderStatus: z.nativeEnum(OrderStatusEnum).optional(),
  paymentStatus: z.nativeEnum(PaymentStatusEnum).optional(),
});

export class OrdersFilterDto extends createZodDto(OrdersFilterSchema) {}
