import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const reportReviewSchema = z.object({
  reason: z.string().trim().min(3).max(255),
  details: z.string().trim().max(2000).optional().nullable(),
});

export class ReportReviewDto extends createZodDto(reportReviewSchema) {}
