import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { tagParamSchema } from './tag-param.dto';
import { LOCALE_REGEX } from '@/common/constants/regex.constants';

export const tagTranslationParamSchema = tagParamSchema.extend({
  locale: z.string().regex(LOCALE_REGEX, { message: 'Invalid locale format' }),
});

export class TagTranslationParamDto extends createZodDto(
  tagTranslationParamSchema,
) {}
