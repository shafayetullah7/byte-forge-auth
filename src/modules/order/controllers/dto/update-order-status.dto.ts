import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const expectedUpdatedAtSchema = z.string().datetime().optional();

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING_PAYMENT',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'EXPIRED',
  ]),
  notes: z.string().max(1000).optional(),
  expectedUpdatedAt: expectedUpdatedAtSchema,
});

export class UpdateOrderStatusDto extends createZodDto(
  UpdateOrderStatusSchema,
) {}
