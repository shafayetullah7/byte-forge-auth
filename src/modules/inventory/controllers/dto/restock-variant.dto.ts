import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const restockVariantSchema = z.object({
  variantId: z.uuid({ message: 'message.validation.invalidUuid' }),
  quantity: z
    .number()
    .int()
    .positive({ message: 'message.validation.inventory.invalidQuantity' }),
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
    .max(500, { message: 'message.validation.maxLength' })
    .optional(),
});

export class RestockVariantDto extends createZodDto(restockVariantSchema) {}
