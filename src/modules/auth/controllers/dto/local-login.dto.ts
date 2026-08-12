import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const localLoginSchema = z.object({
  email: z
    .email({ message: 'message.validation.invalidEmail' })
    .max(255, { message: 'message.validation.maxLength' }),

  password: z
    .string({
      // Unified generic error for both missing/invalid type issues
      error: 'message.validation.required',
    })
    .min(8, { message: 'message.validation.minLength' })
    .max(255, { message: 'message.validation.maxLength' }),
});

export class LocalLoginDto extends createZodDto(localLoginSchema) {}
