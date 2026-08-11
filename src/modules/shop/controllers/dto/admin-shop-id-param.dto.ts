import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const adminShopIdParamSchema = z.object({
  id: z.string().uuid('Invalid shop ID format'),
});

export class AdminShopIdParamDto extends createZodDto(adminShopIdParamSchema) {}
