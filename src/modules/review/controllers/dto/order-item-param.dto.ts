import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const orderItemParamSchema = z.object({
  orderItemId: z.string().uuid(),
});

export class OrderItemParamDto extends createZodDto(orderItemParamSchema) {}
