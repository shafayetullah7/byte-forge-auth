import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { groupIdParamSchema } from './group-id-param.dto';
import { LOCALE_REGEX } from '@/common/constants/regex.constants';

export const tagGroupTranslationParamSchema = groupIdParamSchema.extend({
  locale: z.string().regex(LOCALE_REGEX, { message: 'Invalid locale format' }),
});

export class TagGroupTranslationParamDto extends createZodDto(
  tagGroupTranslationParamSchema,
) {}
