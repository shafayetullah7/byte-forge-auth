import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const adminSuspendShopSchema = z.object({
  reason: z
    .string()
    .min(10, 'Suspension reason must be at least 10 characters'),
});

export class AdminSuspendShopDto extends createZodDto(adminSuspendShopSchema) {}
