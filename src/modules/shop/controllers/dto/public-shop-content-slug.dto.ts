import { createZodDto } from 'nestjs-zod';
import { SlugSchema } from '@/common/schemas/slug.schema';
import { publicShopSlugSchema } from './public-shop-slug.dto';

export const publicShopCampaignSlugSchema = publicShopSlugSchema.extend({
  campaignSlug: SlugSchema,
});

export class PublicShopCampaignSlugDto extends createZodDto(
  publicShopCampaignSlugSchema,
) {}

export const publicShopArticleSlugSchema = publicShopSlugSchema.extend({
  articleSlug: SlugSchema,
});

export class PublicShopArticleSlugDto extends createZodDto(
  publicShopArticleSlugSchema,
) {}
