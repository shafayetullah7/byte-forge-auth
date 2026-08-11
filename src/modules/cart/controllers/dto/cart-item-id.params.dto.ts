import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UUIDSchema = z.string().uuid({ message: 'Invalid UUID format' });

export const CartItemIdParamsSchema = z.object({
  itemId: UUIDSchema,
});

export class CartItemIdParamsDto extends createZodDto(CartItemIdParamsSchema) {}
