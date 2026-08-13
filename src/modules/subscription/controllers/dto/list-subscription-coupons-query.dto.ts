import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const listSubscriptionCouponsQuerySchema = z.object({
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export class ListSubscriptionCouponsQueryDto extends createZodDto(
  listSubscriptionCouponsQuerySchema,
) {}

export class SubscriptionCouponIdParamDto extends createZodDto(
  z.object({
    id: z.string().uuid(),
  }),
) {}
