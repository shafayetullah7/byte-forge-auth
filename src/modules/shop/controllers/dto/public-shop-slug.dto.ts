import { createZodDto } from 'nestjs-zod';
import { shopSlugParamSchema } from './shop-slug-param.dto';

export const publicShopSlugSchema = shopSlugParamSchema;

export class PublicShopSlugDto extends createZodDto(publicShopSlugSchema) {}
