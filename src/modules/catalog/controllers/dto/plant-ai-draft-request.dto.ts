import { createZodDto } from 'nestjs-zod';
import { plantAiDraftRequestSchema } from '../../application/plant-ai/plant-ai-draft.schema';

export class PlantAiDraftRequestDto extends createZodDto(
  plantAiDraftRequestSchema,
) {}
