import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UUIDSchema } from './cart-item-id.params.dto';

export const BulkUpdateCartItemSchema = z.object({
  itemId: UUIDSchema,
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(0, 'Quantity must be at least 0')
    .max(999, 'Quantity cannot exceed 999'),
});

export const BulkUpdateCartItemsSchema = z.object({
  items: z
    .array(BulkUpdateCartItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Cannot update more than 50 items at once'),
});

export class BulkUpdateCartItemsDto extends createZodDto(
  BulkUpdateCartItemsSchema,
) {}
