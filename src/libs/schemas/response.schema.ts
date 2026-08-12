import { z } from 'zod';

const ValidationErrorSchema = z.object({
  field: z.string(), // Which field failed validation
  message: z.string(), // Human-readable error
  code: z.string().optional(), // Machine-readable code (e.g., "TOO_SMALL")
});

const ErrorSchema = z.object({
  code: z.string(), // Main error code (e.g., "VALIDATION_FAILED")
  message: z.string().optional(), // General error context
  validationErrors: ValidationErrorSchema.array().optional(), // <-- Structured errors
});

// Warning sub-schema (array format)
const WarningSchema = z
  .object({
    code: z.string(),
    details: z.string().optional(),
  })
  .array();
// Meta/pagination sub-schema
const MetaSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  total: z.number().optional(),
});

// Base response schema
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: ErrorSchema.optional(),
  warnings: WarningSchema.optional(),
  meta: MetaSchema.optional(),
  timestamp: z.string().datetime(),
});

// Success response schema
export const SuccessResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  error: z.undefined(),
  data: z.any(), // Require data for success
  warnings: WarningSchema.optional(),
  meta: MetaSchema.optional(),
  timestamp: z.string().datetime(),
});

// Error response schema
export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: ErrorSchema,
  data: z.undefined(),
  warnings: WarningSchema.optional(),
  timestamp: z.string().datetime(),
});
