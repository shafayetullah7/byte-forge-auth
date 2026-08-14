import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/libs/schemas/slug.schema';

const localeTranslationSchema = z.object({
  locale: z.enum(['en', 'bn']),
  name: z.string().trim().min(1).max(255),
  description: z.string().optional().nullable(),
});

const translationRecordSchema = z.object({
  en: z.object({
    name: z.string().trim().min(1).max(255),
    description: z.string().optional().nullable(),
  }),
  bn: z.object({
    name: z.string().trim().min(1).max(255),
    description: z.string().optional().nullable(),
  }),
});

const translationsInputSchema = z.union([
  z.array(localeTranslationSchema).min(2).max(2),
  translationRecordSchema,
]);

const tagImportSchema = z.object({
  slug: SlugSchema,
  isActive: z.boolean().optional(),
  translations: translationsInputSchema,
});

const groupImportSchema = z.object({
  slug: SlugSchema,
  isActive: z.boolean().optional(),
  existing: z.boolean().optional(),
  translations: translationsInputSchema.optional(),
  tags: z.array(tagImportSchema).optional().default([]),
});

const bulkImportTagGroupsSchema = z.object({
  groups: z.array(groupImportSchema).min(1, 'At least one tag group is required'),
  options: z
    .object({
      dryRun: z.boolean().optional().default(false),
      onDuplicate: z.enum(['skip', 'error', 'upsert']).optional().default('skip'),
    })
    .optional()
    .default({ dryRun: false, onDuplicate: 'skip' }),
});

export class BulkImportTagGroupsDto extends createZodDto(
  bulkImportTagGroupsSchema,
) {}

export type BulkImportTagGroupsInput = z.infer<typeof bulkImportTagGroupsSchema>;
export type TagGroupImportInput = z.infer<typeof groupImportSchema>;
export type TagImportInput = z.infer<typeof tagImportSchema>;
