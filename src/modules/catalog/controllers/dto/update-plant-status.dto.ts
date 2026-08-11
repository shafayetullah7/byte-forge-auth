import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ProductStatusEnum } from '@/_db/drizzle/enum';

export const updatePlantStatusSchema = z.object({
  status: z.enum(Object.keys(ProductStatusEnum) as [string, ...string[]], {
    message: 'Invalid status value',
  }),
});

export class UpdatePlantStatusDto extends createZodDto(
  updatePlantStatusSchema,
) {}
