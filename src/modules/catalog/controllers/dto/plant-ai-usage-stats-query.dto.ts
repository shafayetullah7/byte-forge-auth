import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const plantAiUsageStatsQuerySchema = z.object({
  usageDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'usageDate must be YYYY-MM-DD (UTC)')
    .optional(),
});

export class PlantAiUsageStatsQueryDto extends createZodDto(
  plantAiUsageStatsQuerySchema,
) {}
