import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updatePaymentMethodSchema = z.object({
  displayName: z.string().trim().min(1).max(255).optional(),
  logoId: z.string().uuid().optional().nullable(),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
});

export class UpdatePaymentMethodDto extends createZodDto(
  updatePaymentMethodSchema,
) {}
