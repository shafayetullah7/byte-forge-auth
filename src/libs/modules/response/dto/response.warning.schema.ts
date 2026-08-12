import { z } from 'zod';

export const WarningSchema = z.object({
  code: z.string(),
  details: z.string().optional(),
});

export type WarningDto = z.infer<typeof WarningSchema>;
