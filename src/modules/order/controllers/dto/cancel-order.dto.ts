import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CancelSellerOrderSchema = z.object({
  reason: z.string().min(1).max(1000),
  expectedUpdatedAt: z.string().datetime().optional(),
});

export class CancelSellerOrderDto extends createZodDto(
  CancelSellerOrderSchema,
) {}
