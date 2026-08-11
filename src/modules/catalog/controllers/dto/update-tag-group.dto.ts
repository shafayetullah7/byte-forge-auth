import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/common/schemas/slug.schema';

const updateTagGroupSchema = z.object({
  slug: SlugSchema.optional(),
  isActive: z.boolean().optional(),
});

export class UpdateTagGroupDto extends createZodDto(updateTagGroupSchema) {}
