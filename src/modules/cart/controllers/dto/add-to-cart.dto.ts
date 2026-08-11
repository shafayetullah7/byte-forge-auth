import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UUIDSchema } from '@/common/schemas/uuid.schema';

export { UUIDSchema };

export const AddToCartSchema = z.object({
  variantId: UUIDSchema,
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(999, 'Quantity cannot exceed 999'),
});

export class AddToCartDto extends createZodDto(AddToCartSchema) {}
