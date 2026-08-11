import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UUIDSchema } from '@/api/user/buyer/cart/dto/add-to-cart.dto';
import { PaymentMethodEnum } from '@/_db/drizzle/enum/payment-method.enum';

const paymentMethodKeys = Object.values(PaymentMethodEnum) as [
  (typeof PaymentMethodEnum)[keyof typeof PaymentMethodEnum],
  ...(typeof PaymentMethodEnum)[keyof typeof PaymentMethodEnum][],
];

export const PlaceOrderBodySchema = z.object({
  addressId: UUIDSchema.describe('Shipping address ID'),
  itemIds: z.array(UUIDSchema).min(1, 'At least one item must be selected'),
  paymentMethod: z
    .enum(paymentMethodKeys)
    .default(PaymentMethodEnum.COD)
    .describe('Active payment method key from GET /payment-methods'),
  notes: z.string().max(1000).optional(),
});

export class PlaceOrderBodyDto extends createZodDto(PlaceOrderBodySchema) {}
