import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const reviewReportIdParamSchema = z.object({
  reportId: z.string().uuid(),
});

export class ReviewReportIdParamDto extends createZodDto(
  reviewReportIdParamSchema,
) {}
