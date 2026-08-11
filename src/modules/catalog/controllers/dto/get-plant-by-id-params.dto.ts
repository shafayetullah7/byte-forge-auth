import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getPlantByIdParamsSchema = z.object({
  id: z.uuid({ message: 'Plant ID must be a valid UUID' }),
});

export class GetPlantByIdParamsDto extends createZodDto(
  getPlantByIdParamsSchema,
) {}
