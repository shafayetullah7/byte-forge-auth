import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateCartItemSchema = z.object({
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(999, 'Quantity cannot exceed 999'),
});

export class UpdateCartItemDto extends createZodDto(UpdateCartItemSchema) {}
