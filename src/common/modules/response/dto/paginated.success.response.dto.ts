import { z } from 'zod';
import { SuccessResponseSchema } from './success.response.dto';

export const PaginatedSuccessResponseSchema = SuccessResponseSchema.extend({
  meta: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    pages: z.number().int().positive(),
  }),
});

export type PaginatedSuccessResponse<T> = z.infer<
  typeof PaginatedSuccessResponseSchema
> & { data: T };
