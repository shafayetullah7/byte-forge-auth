import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const listSubscriptionPlansQuerySchema = z.object({
  search: z.string().trim().optional(),
  includeRetired: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  activeForNewOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export class ListSubscriptionPlansQueryDto extends createZodDto(
  listSubscriptionPlansQuerySchema,
) {}

export class SubscriptionPlanIdParamDto extends createZodDto(
  z.object({
    id: z.string().uuid(),
  }),
) {}
