import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createLanguageSchema = z.object({
  code: z.string().trim().min(2, 'Code must be at least 2 chars').max(10), // e.g. 'en-US'
  name: z.string().trim().min(1, 'Name cannot be empty').max(100),
  isRtl: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export class CreateLanguageDto extends createZodDto(createLanguageSchema) {}
