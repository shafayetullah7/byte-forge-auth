import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const productIdParamSchema = z.object({
  productId: z.string().uuid(),
});

export class ProductIdParamDto extends createZodDto(productIdParamSchema) {}
