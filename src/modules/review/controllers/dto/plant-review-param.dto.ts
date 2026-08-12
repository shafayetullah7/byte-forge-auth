import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const plantReviewParamSchema = z.object({
  slug: z.string().trim().min(1),
});

export class PlantReviewParamDto extends createZodDto(plantReviewParamSchema) {}
