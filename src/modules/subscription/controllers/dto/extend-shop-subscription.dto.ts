import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const extendShopSubscriptionSchema = z
  .object({
    days: z.coerce.number().int().positive().optional(),
    months: z.coerce.number().int().positive().optional(),
    reason: z.string().trim().min(1).max(500),
  })
  .refine((data) => Boolean(data.days) !== Boolean(data.months), {
    message: 'Provide exactly one of days or months',
  });

export class ExtendShopSubscriptionDto extends createZodDto(
  extendShopSubscriptionSchema,
) {}
