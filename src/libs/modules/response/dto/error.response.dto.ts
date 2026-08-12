import { z } from 'zod';
import { BaseResponseSchema } from './base.response.dto';
import { WarningSchema } from './response.warning.schema';
import { ErrorSchema } from './error.schema';

export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: ErrorSchema,
  statusCode: z.number(), // ✅ Added: HTTP status code
  warnings: z.array(WarningSchema).optional(),
  data: z.null().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
