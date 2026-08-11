import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const bulkShippingRateItemSchema = z.object({
  districtId: z.string().uuid({ message: 'message.validation.invalidUuid' }),
  cost: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 999999.99;
      },
      { message: 'message.validation.invalidShippingCost' },
    ),
  costPerKg: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val !== undefined ? String(val) : '0'))
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 999999.99;
      },
      { message: 'message.validation.invalidShippingCostPerKg' },
    ),
});

export const bulkUpdateShippingRatesSchema = z.object({
  rates: z.array(bulkShippingRateItemSchema).min(1, {
    message: 'message.validation.atLeastOneRate',
  }),
});

export class BulkUpdateShippingRatesDto extends createZodDto(
  bulkUpdateShippingRatesSchema,
) {}
