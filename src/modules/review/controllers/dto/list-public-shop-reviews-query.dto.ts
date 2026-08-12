import { createZodDto } from 'nestjs-zod';
import { PaginationParamsSchema } from '@/libs/schemas/pagination.schema';

export class ListPublicShopReviewsQueryDto extends createZodDto(
  PaginationParamsSchema,
) {}
