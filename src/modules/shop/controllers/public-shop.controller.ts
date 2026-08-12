import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ResponseService } from '@/common/modules/response/response.service';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import { ApiNotFoundResponse } from '@/common/decorators/api-error.decorator';
import {
  GetPublicShopBySlugQuery,
  ListPublicShopProductsQuery,
  ListPublicShopsQuery,
} from '../application/queries';
import { PublicShopSlugDto } from './dto/public-shop-slug.dto';
import { ListPublicShopsQueryDto } from './dto/list-public-shops-query.dto';
import { ListPublicShopProductsQueryDto } from './dto/list-public-shop-products-query.dto';

@ApiTags('🏪 Public - Shops')
@Controller({ path: 'shops', version: '1' })
export class PublicShopController {
  constructor(
    private readonly listPublicShopsQuery: ListPublicShopsQuery,
    private readonly listPublicShopProductsQuery: ListPublicShopProductsQuery,
    private readonly getPublicShopBySlugQuery: GetPublicShopBySlugQuery,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'List verified public shops' })
  @ApiResponse({ status: 200, description: 'Shops retrieved' })
  @Get()
  async listShops(
    @Query() query: ListPublicShopsQueryDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.listPublicShopsQuery.execute(query, lang);
    return this.responseService.paginated({
      message: this.i18n.t('message.success.shopsRetrieved', {
        lang,
        defaultValue: this.i18n.t('message.success.shopRetrieved', { lang }),
      }),
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get shop products by slug' })
  @ApiResponse({ status: 200, description: 'Shop products retrieved' })
  @ApiNotFoundResponse('Shop')
  @Get(':slug/products')
  async listShopProducts(
    @Param() params: PublicShopSlugDto,
    @Query() query: ListPublicShopProductsQueryDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.listPublicShopProductsQuery.execute(
      params.slug,
      query,
      lang,
    );
    return this.responseService.paginated({
      message: this.i18n.t('message.success.shopProductsRetrieved', {
        lang,
        defaultValue: 'Shop products retrieved successfully',
      }),
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get public shop by slug',
    description: 'Retrieves public shop information without authentication.',
  })
  @ApiResponse({ status: 200, description: 'Public shop retrieved' })
  @ApiNotFoundResponse('Shop')
  @Get(':slug')
  async getPublicShopBySlug(
    @Param() params: PublicShopSlugDto,
    @I18nLang() lang: string,
  ) {
    const shop = await this.getPublicShopBySlugQuery.execute(params.slug, lang);
    return this.responseService.success({
      message: this.i18n.t('message.success.shopRetrieved', { lang }),
      data: shop,
    });
  }
}
