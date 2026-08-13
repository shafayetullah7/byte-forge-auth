import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SubscriptionDurationUnitEnum } from '@/_db/drizzle/enum/subscription-duration-unit.enum';
import { subscriptionCouponDateSchema } from './create-subscription-coupon.dto';

const durationUnitSchema = z.enum([
  SubscriptionDurationUnitEnum.DAY,
  SubscriptionDurationUnitEnum.MONTH,
]);

const updateSubscriptionCouponSchema = z
  .object({
    code: z.string().trim().min(1).max(64).optional(),
    durationValue: z.coerce.number().int().positive().optional(),
    durationUnit: durationUnitSchema.optional(),
    maxRedemptions: z.coerce.number().int().positive().optional().nullable(),
    validFrom: subscriptionCouponDateSchema,
    validUntil: subscriptionCouponDateSchema,
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export class UpdateSubscriptionCouponDto extends createZodDto(
  updateSubscriptionCouponSchema,
) {}
