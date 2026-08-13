import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SubscriptionDurationUnitEnum } from '@/_db/drizzle/enum/subscription-duration-unit.enum';

const durationUnitSchema = z.enum([
  SubscriptionDurationUnitEnum.DAY,
  SubscriptionDurationUnitEnum.MONTH,
]);

export const subscriptionCouponDateSchema = z
  .string()
  .datetime({ offset: true })
  .optional()
  .nullable();

const createSubscriptionCouponSchema = z.object({
  code: z.string().trim().min(1).max(64),
  durationValue: z.coerce.number().int().positive(),
  durationUnit: durationUnitSchema,
  maxRedemptions: z.coerce.number().int().positive().optional().nullable(),
  validFrom: subscriptionCouponDateSchema,
  validUntil: subscriptionCouponDateSchema,
});

export class CreateSubscriptionCouponDto extends createZodDto(
  createSubscriptionCouponSchema,
) {}
