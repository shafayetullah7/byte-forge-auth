import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const deleteMediaSchema = z.object({
  id: z.uuid(),
});

export class DeleteMediaDto extends createZodDto(deleteMediaSchema) {}
