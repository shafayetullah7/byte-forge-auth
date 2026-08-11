import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  createPlantSchema,
  productVariantSchema,
  UUIDSchema,
} from './create-plant.dto';

export const updateVariantSchema = productVariantSchema
  .extend({
    id: UUIDSchema.optional(),
  })
  .omit({
    inventoryCount: true,
    trackInventory: true,
    lowStockThreshold: true,
  });

export const updatePlantSchema = createPlantSchema.extend({
  variants: z
    .array(updateVariantSchema)
    .min(1, 'At least one variant is required')
    .max(50, 'Maximum 50 variants allowed per product')
    .refine(
      (data) => data.filter((v) => v.isBase).length === 1,
      'Exactly one variant must be marked as base (isBase: true)',
    ),
});

export type UpdatePlantDtoType = z.infer<typeof updatePlantSchema>;
export type UpdateVariantDtoType = z.infer<typeof updateVariantSchema>;

export class UpdatePlantDto extends createZodDto(updatePlantSchema) {}

const STOCK_FIELD_KEYS = [
  'inventoryCount',
  'trackInventory',
  'lowStockThreshold',
] as const;

/** Reject catalog PATCH bodies that include stock fields on variants. */
export function assertNoStockFieldsOnUpdate(body: unknown): void {
  if (!body || typeof body !== 'object') return;
  const variants = (body as { variants?: unknown }).variants;
  if (!Array.isArray(variants)) return;

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i] as Record<string, unknown>;
    if (!variant || typeof variant !== 'object') continue;
    for (const key of STOCK_FIELD_KEYS) {
      if (key in variant) {
        throw new Error(`STOCK_FIELD:${key}:variants.${i}.${key}`);
      }
    }
  }
}

export function isStatusOnlyPlantUpdate(
  body: Record<string, unknown>,
): boolean {
  const keys = Object.keys(body);
  return keys.length === 1 && keys[0] === 'status';
}
