import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@/libs/schemas/pagination.schema';
import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';

export const listArticlesQuerySchema = PaginationParamsSchema.extend({
  moderationStatus: z.nativeEnum(ShopContentModerationStatusEnum).optional(),
});

export class ListArticlesQueryDto extends createZodDto(
  listArticlesQuerySchema,
) {}
