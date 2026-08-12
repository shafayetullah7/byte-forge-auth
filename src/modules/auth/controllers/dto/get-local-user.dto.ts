// import { ZodDtoFactory } from '@/common/factories/zod.dto.factory';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const getLocalUserQuerySchema = z
  .object({
    id: z
      .uuid('ID must be a valid UUID')
      .min(36, 'ID must be exactly 36 characters')
      .max(36, 'ID must be exactly 36 characters'),

    email: z
      .email('Email must be a valid email address')
      .min(5, 'Email must be at least 5 characters long')
      .max(255, 'Email cannot exceed 255 characters'),
  })
  .partial();

export class GetLocalUserQueryDto extends createZodDto(
  getLocalUserQuerySchema,
) {}
