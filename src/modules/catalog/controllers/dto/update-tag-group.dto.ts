import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/libs/schemas/slug.schema';

const updateTagGroupSchema = z.object({
  slug: SlugSchema.optional(),
  isActive: z.boolean().optional(),
});

export class UpdateTagGroupDto extends createZodDto(updateTagGroupSchema) {}
