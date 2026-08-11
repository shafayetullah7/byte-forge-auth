import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const listItemTranslationSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, { message: 'message.validation.notEmpty' })
    .max(500, { message: 'message.validation.maxLength' }),
});

const storefrontListItemSchema = z.object({
  id: z.string().uuid({ message: 'message.validation.invalidUuid' }).optional(),
  translations: z.object({
    en: listItemTranslationSchema,
    bn: listItemTranslationSchema,
  }),
});

export const replaceStorefrontListSchema = z.object({
  items: z.array(storefrontListItemSchema).max(10),
});

export class ReplaceStorefrontListDto extends createZodDto(
  replaceStorefrontListSchema,
) {}
