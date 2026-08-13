import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const adminShopSubscriptionParamSchema = z.object({
  shopId: z.uuid('Invalid shop ID format'),
});

export class AdminShopSubscriptionParamDto extends createZodDto(
  adminShopSubscriptionParamSchema,
) {}
