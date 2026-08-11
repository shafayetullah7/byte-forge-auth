import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const listPaymentMethodsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export class ListPaymentMethodsQueryDto extends createZodDto(
  listPaymentMethodsQuerySchema,
) {}
