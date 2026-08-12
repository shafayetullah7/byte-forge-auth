import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createLocalUserSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'message.validation.notEmpty' })
    .max(50, { message: 'message.validation.maxLength' })
    .regex(/^[a-zA-Z]+$/, { message: 'message.validation.invalidName' }),

  lastName: z
    .string()
    .min(1, { message: 'message.validation.notEmpty' })
    .max(50, { message: 'message.validation.maxLength' })
    .regex(/^[a-zA-Z]+$/, { message: 'message.validation.invalidName' }),

  userName: z
    .string()
    .min(3, { message: 'message.validation.minLength' })
    .max(50, { message: 'message.validation.maxLength' })
    .regex(/^[a-z0-9_]+$/, {
      message: 'message.validation.invalidUsername',
    }),

  email: z
    .email({ message: 'message.validation.invalidEmail' })
    .max(255, { message: 'message.validation.maxLength' }),

  password: z
    .string()
    .min(8, { message: 'message.validation.minLength' })
    .max(255, { message: 'message.validation.maxLength' })
    .regex(/[A-Z]/, {
      message: 'message.validation.passwordUppercase',
    })
    .regex(/[a-z]/, {
      message: 'message.validation.passwordLowercase',
    })
    .regex(/[0-9]/, { message: 'message.validation.passwordNumber' })
    .regex(/[^A-Za-z0-9]/, {
      message: 'message.validation.passwordSpecial',
    }),
});

export class CreateLocalUserDto extends createZodDto(createLocalUserSchema) {}
