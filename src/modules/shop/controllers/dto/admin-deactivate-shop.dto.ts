import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const adminDeactivateShopSchema = z.object({
  reason: z
    .string()
    .min(10, 'Deactivation reason must be at least 10 characters'),
});

export class AdminDeactivateShopDto extends createZodDto(
  adminDeactivateShopSchema,
) {}
