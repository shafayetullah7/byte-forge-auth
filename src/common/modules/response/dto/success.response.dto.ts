import { z } from 'zod';
import { BaseResponseSchema } from './base.response.dto';
import { WarningSchema } from './response.warning.schema';

export const SuccessResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.unknown(), // Will be refined per endpoint
  warnings: z.array(WarningSchema).optional(),
});

export type SuccessResponse<T> = z.infer<typeof SuccessResponseSchema> & {
  data: T;
};
