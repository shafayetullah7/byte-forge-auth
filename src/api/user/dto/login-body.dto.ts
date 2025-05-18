import { ZodDtoFactory } from 'src/common/factories/zod.dto.factory';
import { z } from 'zod';

const loginBodySchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .min(1, 'Email cannot be empty')
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .transform((val) => val.toLowerCase()),

  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .min(1, 'Password cannot be empty')
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be less than 255 characters'),
});

export class LoginBodyDto extends ZodDtoFactory.create(loginBodySchema) {}
