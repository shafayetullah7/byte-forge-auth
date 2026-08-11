import { z } from 'zod';

export const AdminRejectShopDtoSchema = z.object({
  reason: z.string().trim().min(10, {
    message: 'Rejection reason must be at least 10 characters',
  }),
  adminNotes: z.string().trim().optional(),
});

export type AdminRejectShopDto = z.infer<typeof AdminRejectShopDtoSchema>;
