import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const plantSlugParamsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be at most 255 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens',
    ),
});

export class PlantSlugParamsDto extends createZodDto(plantSlugParamsSchema) {}
