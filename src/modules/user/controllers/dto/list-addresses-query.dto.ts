import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';

export const AddressTypeFilterSchema = z.object({
  type: z.enum(['shipping', 'billing', 'both']).optional(),
});

export class AddressTypeFilterDto extends createZodDto(
  AddressTypeFilterSchema,
) {}

export const AddressPaginationSchema = PaginationParamsSchema.extend({
  type: z.enum(['shipping', 'billing', 'both']).optional(),
});

export class AddressPaginationDto extends createZodDto(
  AddressPaginationSchema,
) {}
