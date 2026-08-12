import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const markDamagedSchema = z.object({
  variantId: z.string().uuid({ message: 'message.validation.invalidUuid' }),
  quantity: z
    .number()
    .int()
    .positive({ message: 'message.validation.inventory.invalidQuantity' }),
  reason: z
    .string()
    .trim()
    .min(1, { message: 'message.validation.notEmpty' })
    .max(500, { message: 'message.validation.maxLength' })
    .optional(),
});

export class MarkDamagedDto extends createZodDto(markDamagedSchema) {}
