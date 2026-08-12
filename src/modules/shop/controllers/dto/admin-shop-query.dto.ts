import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ShopStatusEnum, ShopVerificationStatusEnum } from '@/_db/drizzle/enum';
import { PaginationParamsSchema } from '@/libs/schemas/pagination.schema';

const adminShopQuerySchema = PaginationParamsSchema.extend({
  status: z.nativeEnum(ShopStatusEnum).optional(),
  verificationStatus: z.nativeEnum(ShopVerificationStatusEnum).optional(),
});

export class AdminShopQueryDto extends createZodDto(adminShopQuerySchema) {}
