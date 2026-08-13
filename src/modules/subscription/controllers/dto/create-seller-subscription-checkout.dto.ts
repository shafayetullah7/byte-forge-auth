import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createSellerSubscriptionCheckoutSchema = z.object({
  planId: z.uuid('Invalid plan ID format'),
});

export class CreateSellerSubscriptionCheckoutDto extends createZodDto(
  createSellerSubscriptionCheckoutSchema,
) {}
