import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getDistrictByIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'District ID must be a valid UUID' }),
});

export class GetDistrictByIdParamsDto extends createZodDto(
  getDistrictByIdParamsSchema,
) {}
