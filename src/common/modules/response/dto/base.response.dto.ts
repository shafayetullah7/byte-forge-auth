import { z } from 'zod';

export const BaseResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    timestamp: z.string().datetime(),
  })
  .strict();
