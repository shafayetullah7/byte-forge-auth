import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const EditorsPickSchema = z.object({
  isEditorsPick: z.boolean(),
});

export class EditorsPickDto extends createZodDto(EditorsPickSchema) {}
