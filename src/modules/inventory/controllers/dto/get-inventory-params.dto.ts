import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getInventoryParamsSchema = z.object({
  id: z.string().uuid({ message: 'message.validation.invalidUuid' }),
});

export class GetInventoryParamsDto extends createZodDto(
  getInventoryParamsSchema,
) {}
