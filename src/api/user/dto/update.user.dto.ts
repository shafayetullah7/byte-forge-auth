import { ZodDtoFactory } from 'src/common/factories/zod.dto.factory';
import { z } from 'zod';

const passwordValidation = z
  .string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  })
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

const UpdateUserBodySchema = z
  .object({
    firstName: z
      .string({
        required_error: 'First name is required',
        invalid_type_error: 'First name must be a string',
      })
      .min(2, 'First name must be at least 2 characters')
      .max(255, 'First name must be less than 255 characters')
      .optional(),

    lastName: z
      .string({
        required_error: 'Last name is required',
        invalid_type_error: 'Last name must be a string',
      })
      .min(2, 'Last name must be at least 2 characters')
      .max(255, 'Last name must be less than 255 characters')
      .optional(),

    password: passwordValidation.optional(),
  })
  .refine((data) => {
    return !!Object.keys(data).length;
  }, 'No data provided');

export class UpdateUserBodyDto extends ZodDtoFactory.create(
  UpdateUserBodySchema,
) {}

// Type for TypeScript usage
// export type CreateUserDto = z.infer<typeof CreateUserSchema>;
