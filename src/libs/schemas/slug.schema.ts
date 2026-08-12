import { z } from 'zod';

/**
 * Reusable Zod schema for URL-safe slugs.
 *
 * Valid:  "low-light", "watering-frequency", "tag123"
 * Invalid: "Low Light", "low_light", "-starts-with-dash", "ends-with-dash-"
 *
 * Usage:
 *   import { SlugSchema } from '@/libs/schemas/slug.schema';
 *   slug: SlugSchema,
 *   slug: SlugSchema.optional(),
 */
export const SlugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(255, 'Slug must be at most 255 characters')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase alphanumeric with hyphens only (e.g. low-light)',
  );
