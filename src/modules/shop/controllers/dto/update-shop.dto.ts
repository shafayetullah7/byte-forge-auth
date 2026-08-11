import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateShopTranslationSchema = z.object({
  locale: z
    .string()
    .min(2, { message: 'message.validation.minLength' })
    .max(10, { message: 'message.validation.maxLength' }),
  name: z
    .string()
    .trim()
    .min(1, { message: 'message.validation.notEmpty' })
    .max(255, { message: 'message.validation.maxLength' })
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, { message: 'message.validation.minLength' })
    .max(2000, { message: 'message.validation.maxLength' })
    .optional(),
  businessHours: z.string().trim().optional(),
});

export const updateShopSchema = z.object({
  address: z
    .string()
    .trim()
    .min(5, { message: 'message.validation.minLength' })
    .max(500, { message: 'message.validation.maxLength' })
    .optional(),
  translations: z.array(updateShopTranslationSchema).optional(),
});

export class UpdateShopDto extends createZodDto(updateShopSchema) {}
