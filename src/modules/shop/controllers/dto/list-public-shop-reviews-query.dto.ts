import { createZodDto } from 'nestjs-zod';
import { PaginationParamsSchema } from '@/common/schemas/pagination.schema';

export class ListPublicShopReviewsQueryDto extends createZodDto(
  PaginationParamsSchema,
) {}
