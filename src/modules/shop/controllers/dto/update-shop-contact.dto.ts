import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateShopContactSchema = z
  .object({
    businessEmail: z
      .email({ message: 'message.validation.invalidEmail' })
      .max(255, { message: 'message.validation.maxLength' })
      .optional(),
    phone: z
      .string()
      .min(10, { message: 'message.validation.minLength' })
      .max(20, { message: 'message.validation.maxLength' })
      .optional(),
    alternativePhone: z
      .string()
      .min(10, { message: 'message.validation.minLength' })
      .max(20, { message: 'message.validation.maxLength' })
      .optional(),
    whatsapp: z
      .string()
      .max(20, { message: 'message.validation.maxLength' })
      .optional(),
    telegram: z
      .string()
      .max(50, { message: 'message.validation.maxLength' })
      .optional(),
    facebook: z
      .string()
      .url({ message: 'message.validation.invalidUrl' })
      .max(255, { message: 'message.validation.maxLength' })
      .optional(),
    instagram: z
      .string()
      .url({ message: 'message.validation.invalidUrl' })
      .max(255, { message: 'message.validation.maxLength' })
      .optional(),
    x: z
      .string()
      .url({ message: 'message.validation.invalidUrl' })
      .max(255, { message: 'message.validation.maxLength' })
      .optional(),
  })
  .refine((data) => Object.values(data).some((val) => val !== undefined), {
    message: 'message.validation.atLeastOne',
  });

export class UpdateShopContactDto extends createZodDto(
  updateShopContactSchema,
) {}
