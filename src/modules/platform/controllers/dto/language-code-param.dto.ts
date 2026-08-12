import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const languageCodeParamSchema = z.object({
  code: z.string().min(2).max(10),
});

export class LanguageCodeParamDto extends createZodDto(
  languageCodeParamSchema,
) {}
