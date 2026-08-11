import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const addressTranslationSchema = z.object({
  country: z.string().min(2).max(100),
  division: z.string().min(2).max(100),
  district: z.string().min(2).max(100),
  street: z.string().min(5).max(255),
});

export const updateShopAddressSchema = z
  .object({
    postalCode: z
      .string()
      .min(4, { message: 'message.validation.minLength' })
      .max(20, { message: 'message.validation.maxLength' })
      .optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    googleMapsLink: z
      .string()
      .url({ message: 'message.validation.invalidUrl' })
      .max(500, { message: 'message.validation.maxLength' })
      .optional(),
    translations: z
      .object({
        en: addressTranslationSchema,
        bn: addressTranslationSchema,
      })
      .optional(),
  })
  .refine(
    (data) =>
      !!data.postalCode ||
      !!data.latitude ||
      !!data.longitude ||
      !!data.googleMapsLink ||
      !!data.translations,
    { message: 'message.validation.atLeastOne' },
  );

export class UpdateShopAddressDto extends createZodDto(
  updateShopAddressSchema,
) {}
