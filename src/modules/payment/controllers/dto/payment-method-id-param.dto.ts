import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const paymentMethodIdParamSchema = z.object({
  id: z.string().uuid(),
});

export class PaymentMethodIdParamDto extends createZodDto(
  paymentMethodIdParamSchema,
) {}
