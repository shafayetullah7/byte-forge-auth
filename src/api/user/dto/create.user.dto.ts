import { ZodDtoFactory } from 'src/common/factories/zod.dto.factory';
import { z } from 'zod';

const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

export const CreateUserSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(255, 'First name must be less than 255 characters')
    .optional(),

  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(255, 'Last name must be less than 255 characters')
    .optional(),

  email: z
    .string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters'),

  password: passwordValidation,
});

export class CreateUserDto extends ZodDtoFactory.create(CreateUserSchema) {}

// Type for TypeScript usage
// export type CreateUserDto = z.infer<typeof CreateUserSchema>;
