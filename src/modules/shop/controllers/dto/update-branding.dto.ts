import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateBrandingSchema = z.object({
  logoId: z.uuid({ message: 'message.validation.invalidUuid' }).optional(),
  bannerId: z.uuid({ message: 'message.validation.invalidUuid' }).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: 'message.validation.invalidHexColor',
    })
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: 'message.validation.invalidHexColor',
    })
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: 'message.validation.invalidHexColor',
    })
    .optional(),
});

export class UpdateBrandingDto extends createZodDto(updateBrandingSchema) {}
