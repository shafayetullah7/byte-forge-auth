import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SubscriptionIntervalEnum } from '@/_db/drizzle/enum/subscription-interval.enum';

const intervalSchema = z.enum([
  SubscriptionIntervalEnum.MONTH,
  SubscriptionIntervalEnum.YEAR,
]);

const priceBdtSchema = z
  .union([
    z.string().trim().regex(/^\d+(\.\d{1,2})?$/),
    z.number().nonnegative(),
  ])
  .transform((value) =>
    typeof value === 'number' ? value.toFixed(2) : value,
  );

const updateSubscriptionPlanSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    description: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((v) => (v === '' ? null : v)),
    interval: intervalSchema.optional(),
    priceBdt: priceBdtSchema.optional(),
    isActiveForNew: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export class UpdateSubscriptionPlanDto extends createZodDto(
  updateSubscriptionPlanSchema,
) {}
