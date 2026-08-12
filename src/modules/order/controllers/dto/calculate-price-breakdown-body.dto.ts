import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UUIDSchema } from '@/libs/schemas/uuid.schema';

export const CalculatePriceBreakdownBodySchema = z.object({
  addressId: UUIDSchema.describe(
    'Shipping address ID to calculate shipping rates for',
  ),
  itemIds: z
    .array(UUIDSchema)
    .min(1, 'At least one item must be selected')
    .describe('List of cart item IDs to include in price calculation'),
});

export class CalculatePriceBreakdownBodyDto extends createZodDto(
  CalculatePriceBreakdownBodySchema,
) {}
