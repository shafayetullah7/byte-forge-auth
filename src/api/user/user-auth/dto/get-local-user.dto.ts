import { ZodDtoFactory } from 'src/common/factories/zod.dto.factory';
import { z } from 'zod';

const getLocalUserQuerySchema = z
  .object({
    id: z
      .string({
        required_error: 'ID is required',
        invalid_type_error: 'ID must be a string',
      })
      .uuid('ID must be a valid UUID')
      .min(36, 'ID must be exactly 36 characters')
      .max(36, 'ID must be exactly 36 characters'),

    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
      })
      .email('Email must be a valid email address')
      .min(5, 'Email must be at least 5 characters long')
      .max(255, 'Email cannot exceed 255 characters'),
  })
  .partial();

export class GetLocalUserQueryDto extends ZodDtoFactory.create(
  getLocalUserQuerySchema,
) {}
