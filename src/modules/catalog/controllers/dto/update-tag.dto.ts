import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/common/schemas/slug.schema';

const updateTagSchema = z.object({
  groupId: z.uuid('Invalid UUID for group ID').optional(),
  slug: SlugSchema.optional(),
  isActive: z.boolean().optional(),
});

export class UpdateTagDto extends createZodDto(updateTagSchema) {}
