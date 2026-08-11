import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UUIDSchema } from './cart-item-id.params.dto';

export const BulkRemoveCartItemsSchema = z.object({
  itemIds: z
    .array(UUIDSchema)
    .min(1, 'At least one item ID is required')
    .max(50, 'Cannot remove more than 50 items at once'),
});

export class BulkRemoveCartItemsDto extends createZodDto(
  BulkRemoveCartItemsSchema,
) {}
