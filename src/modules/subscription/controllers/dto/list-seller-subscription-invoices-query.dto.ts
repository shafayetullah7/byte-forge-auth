import { createZodDto } from 'nestjs-zod';
import { PaginationParamsSchema } from '@/libs/schemas/pagination.schema';

export const listSellerSubscriptionInvoicesQuerySchema =
  PaginationParamsSchema;

export class ListSellerSubscriptionInvoicesQueryDto extends createZodDto(
  listSellerSubscriptionInvoicesQuerySchema,
) {}
