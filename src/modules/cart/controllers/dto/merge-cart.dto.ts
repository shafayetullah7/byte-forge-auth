import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UUIDSchema } from './cart-item-id.params.dto';

export const MergeCartItemSchema = z.object({
  variantId: UUIDSchema,
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(999, 'Quantity cannot exceed 999'),
});

export const MergeCartSchema = z.object({
  guestItems: z
    .array(MergeCartItemSchema)
    .min(1, 'At least one guest item is required')
    .max(50, 'Cannot merge more than 50 items'),
});

export class MergeCartDto extends createZodDto(MergeCartSchema) {}
