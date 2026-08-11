import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const shippingMethodSchema = z.enum([
  'COURIER',
  'SELF_DELIVERY',
  'CUSTOMER_PICKUP',
]);

export const ShipOrderSchema = z
  .object({
    carrier: z.string().max(100).optional(),
    trackingNumber: z.string().max(100).optional(),
    shippingMethod: shippingMethodSchema.default('COURIER'),
    estimatedDelivery: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
    expectedUpdatedAt: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.shippingMethod === 'COURIER') {
      if (!data.carrier?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Carrier is required for courier shipments',
          path: ['carrier'],
        });
      }
      if (!data.trackingNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tracking number is required for courier shipments',
          path: ['trackingNumber'],
        });
      }
    }
  });

export class ShipOrderDto extends createZodDto(ShipOrderSchema) {}

export type TShippingMethodInput = z.infer<typeof shippingMethodSchema>;
