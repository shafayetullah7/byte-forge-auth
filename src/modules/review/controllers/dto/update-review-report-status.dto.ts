import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updateReviewReportStatusSchema = z.object({
  status: z.enum(['OPEN', 'RESOLVED', 'DISMISSED']),
});

export class UpdateReviewReportStatusDto extends createZodDto(
  updateReviewReportStatusSchema,
) {}
