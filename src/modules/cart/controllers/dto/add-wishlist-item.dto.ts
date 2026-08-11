import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addWishlistItemSchema = z.object({
  variantId: z.string().uuid({ message: 'Invalid UUID format' }),
});

export class AddWishlistItemDto extends createZodDto(addWishlistItemSchema) {}
