import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const campaignIdParamSchema = z.object({
  id: z.string().uuid('Invalid campaign ID format'),
});

export class CampaignIdParamDto extends createZodDto(campaignIdParamSchema) {}
