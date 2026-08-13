import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const redeemSubscriptionCouponSchema = z.object({
  code: z.string().trim().min(1).max(64),
});

export class RedeemSubscriptionCouponDto extends createZodDto(
  redeemSubscriptionCouponSchema,
) {}
