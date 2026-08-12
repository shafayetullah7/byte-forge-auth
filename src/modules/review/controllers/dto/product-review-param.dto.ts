import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const productReviewParamSchema = z.object({
  productId: z.string().uuid(),
});

export class ProductReviewParamDto extends createZodDto(
  productReviewParamSchema,
) {}
