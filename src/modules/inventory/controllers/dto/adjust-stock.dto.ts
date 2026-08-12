import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adjustStockSchema = z.object({
  variantId: z.string().uuid({ message: 'message.validation.invalidUuid' }),
  quantityChange: z
    .number()
    .int()
    .refine((n) => n !== 0, {
      message: 'message.validation.notEmpty',
    }),
  referenceType: z
    .string()
    .trim()
    .min(1, { message: 'message.validation.notEmpty' })
    .max(50, { message: 'message.validation.maxLength' })
    .optional(),
  referenceId: z
    .string()
    .trim()
    .min(1, { message: 'message.validation.notEmpty' })
    .max(255, { message: 'message.validation.maxLength' })
    .optional(),
  reason: z
    .string()
    .trim()
    .min(1, { message: 'message.validation.notEmpty' })
    .max(500, { message: 'message.validation.maxLength' }),
});

export class AdjustStockDto extends createZodDto(adjustStockSchema) {}
