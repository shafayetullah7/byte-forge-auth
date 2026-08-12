import { z } from 'zod';

export const ResponseValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export type ResponseValidationError = z.infer<
  typeof ResponseValidationErrorSchema
>;
