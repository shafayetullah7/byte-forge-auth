import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateVerificationSchema = z.object({
  tradeLicenseNumber: z
    .string()
    .trim()
    .min(1, 'Trade license number is required')
    .optional(),
  tradeLicenseDocumentId: z.uuid({ message: 'Invalid UUID' }).optional(),
  tinNumber: z.string().trim().optional(),
  tinDocumentId: z.uuid({ message: 'Invalid UUID' }).optional(),
  utilityBillDocumentId: z.uuid({ message: 'Invalid UUID' }).optional(),
});

export class UpdateVerificationDto extends createZodDto(
  updateVerificationSchema,
) {}
