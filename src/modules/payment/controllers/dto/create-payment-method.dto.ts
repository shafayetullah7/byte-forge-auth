import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaymentMethodEnum } from '@/_db/drizzle/enum/payment-method.enum';

const paymentMethodKeySchema = z.enum([
  PaymentMethodEnum.COD,
  PaymentMethodEnum.CARD,
  PaymentMethodEnum.BKASH,
  PaymentMethodEnum.NAGAD,
  PaymentMethodEnum.SSLCOMMERCE,
]);

const createPaymentMethodSchema = z.object({
  key: paymentMethodKeySchema,
  displayName: z.string().trim().min(1).max(255),
  logoId: z.string().uuid().optional().nullable(),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
});

export class CreatePaymentMethodDto extends createZodDto(
  createPaymentMethodSchema,
) {}
