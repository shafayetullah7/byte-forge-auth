import { createZodDto } from 'nestjs-zod';
import { SlugSchema } from '@/libs/schemas/slug.schema';
import { publicShopSlugSchema } from './public-shop-slug.dto';

export const publicShopArticleSlugSchema = publicShopSlugSchema.extend({
  articleSlug: SlugSchema,
});

export class PublicShopArticleSlugDto extends createZodDto(
  publicShopArticleSlugSchema,
) {}
