import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Matches shop `publicShopSlugSchema` for route parity. */
export const publicShopSlugSchema = z.object({
  slug: z
    .string({ error: 'message.validation.required' })
    .trim()
    .min(1, { message: 'message.validation.notEmpty' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'message.validation.invalidName',
    }),
});

export class PublicShopSlugDto extends createZodDto(publicShopSlugSchema) {}
