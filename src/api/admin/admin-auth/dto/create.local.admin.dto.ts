import { ZodDtoFactory } from 'src/common/factories/zod.dto.factory';
import { z } from 'zod';

const createLocalAdminSchema = z.object({
  firstName: z
    .string({
      required_error: 'First name is required',
      invalid_type_error: 'First name must be a string',
    })
    .min(1, { message: 'First name cannot be empty' })
    .max(50, { message: 'First name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z]+$/, { message: 'First name can only contain letters' }),

  lastName: z
    .string({
      required_error: 'Last name is required',
      invalid_type_error: 'Last name must be a string',
    })
    .min(1, { message: 'Last name cannot be empty' })
    .max(50, { message: 'Last name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z]+$/, { message: 'Last name can only contain letters' }),

  userName: z
    .string({
      required_error: 'Username is required',
      invalid_type_error: 'Username must be a string',
    })
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(50, { message: 'Username cannot exceed 50 characters' })
    .regex(/^[a-z0-9_]+$/, {
      message:
        'Username can only contain lowercase letters, numbers, and underscores',
    }),

  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email({ message: 'Invalid email format' })
    .max(255, { message: 'Email cannot exceed 255 characters' }),

  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(255, { message: 'Password cannot exceed 255 characters' })
    .regex(/[A-Z]/, {
      message: 'Password must contain at least one uppercase letter',
    })
    .regex(/[a-z]/, {
      message: 'Password must contain at least one lowercase letter',
    })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, {
      message: 'Password must contain at least one special character',
    }),
});

export class CreateLocalAdminDto extends ZodDtoFactory.create(
  createLocalAdminSchema,
) {}
