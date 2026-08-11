import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const storefrontProfileTranslationSchema = z.object({
  tagline: z
    .string()
    .trim()
    .max(255, { message: 'message.validation.maxLength' })
    .optional()
    .or(z.literal('')),
  about: z
    .string()
    .trim()
    .max(5000, { message: 'message.validation.maxLength' })
    .optional()
    .or(z.literal('')),
  sellerStory: z
    .string()
    .trim()
    .max(5000, { message: 'message.validation.maxLength' })
    .optional()
    .or(z.literal('')),
  brandMission: z
    .string()
    .trim()
    .max(2000, { message: 'message.validation.maxLength' })
    .optional()
    .or(z.literal('')),
});

export const updateStorefrontProfileSchema = z.object({
  translations: z.object({
    en: storefrontProfileTranslationSchema,
    bn: storefrontProfileTranslationSchema,
  }),
});

export class UpdateStorefrontProfileDto extends createZodDto(
  updateStorefrontProfileSchema,
) {}
