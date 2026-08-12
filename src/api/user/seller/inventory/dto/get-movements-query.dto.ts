import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { InventoryMovementTypeEnum } from '@/_db/drizzle/enum';
import { PaginationParamsSchema } from '@/libs/schemas/pagination.schema';

export const getMovementsQuerySchema = PaginationParamsSchema.extend({
  variantId: z
    .string()
    .uuid({ message: 'message.validation.invalidUuid' })
    .optional(),
  movementType: z.nativeEnum(InventoryMovementTypeEnum).optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
});

export class GetMovementsQueryDto extends createZodDto(
  getMovementsQuerySchema,
) {}
