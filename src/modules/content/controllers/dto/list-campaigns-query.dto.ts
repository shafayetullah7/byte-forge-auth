import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';

export const listCampaignsQuerySchema = PaginationParamsSchema.extend({
  moderationStatus: z.nativeEnum(ShopContentModerationStatusEnum).optional(),
});

export class ListCampaignsQueryDto extends createZodDto(
  listCampaignsQuerySchema,
) {}
