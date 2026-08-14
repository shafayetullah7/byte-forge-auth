import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SlugSchema } from '@/libs/schemas/slug.schema';

const localeTranslationSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
});

const translationRecordSchema = z.object({
  en: z.object({
    name: z.string().trim().min(1).max(255),
    description: z.string().optional().nullable(),
  }),
  bn: z
    .object({
      name: z.string().trim().min(1).max(255),
      description: z.string().optional().nullable(),
    })
    .optional(),
});

const translationsInputSchema = z.union([
  z.array(localeTranslationSchema).min(1),
  translationRecordSchema,
]);

const categoryImportNodeSchema: z.ZodType<CategoryImportNode> = z.lazy(() =>
  z.object({
    slug: SlugSchema,
    parentSlug: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    translations: translationsInputSchema,
    children: z.array(categoryImportNodeSchema).optional(),
  }),
);

export type CategoryImportNode = {
  slug: string;
  parentSlug?: string | null;
  isActive?: boolean;
  commissionRate?: number;
  translations:
    | Array<z.infer<typeof localeTranslationSchema>>
    | z.infer<typeof translationRecordSchema>;
  children?: CategoryImportNode[];
};

const bulkImportCategoriesSchema = z.object({
  items: z.array(categoryImportNodeSchema).min(1, 'At least one category is required'),
  options: z
    .object({
      dryRun: z.boolean().optional().default(false),
      onDuplicate: z.enum(['skip', 'error']).optional().default('skip'),
    })
    .optional()
    .default({ dryRun: false, onDuplicate: 'skip' }),
});

export class BulkImportCategoriesDto extends createZodDto(
  bulkImportCategoriesSchema,
) {}
