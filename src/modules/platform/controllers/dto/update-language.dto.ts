import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updateLanguageSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(100).optional(),
  isRtl: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export class UpdateLanguageDto extends createZodDto(updateLanguageSchema) {}
