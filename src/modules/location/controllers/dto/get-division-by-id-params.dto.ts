import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getDivisionByIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'Division ID must be a valid UUID' }),
});

export class GetDivisionByIdParamsDto extends createZodDto(
  getDivisionByIdParamsSchema,
) {}
