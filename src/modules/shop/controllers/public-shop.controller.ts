import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ResponseService } from '@/common/modules/response/response.service';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import { ApiNotFoundResponse } from '@/common/decorators/api-error.decorator';
import {
  GetPublicShopBySlugQuery,
  ListPublicShopArticlesQuery,
  ListPublicShopCampaignsQuery,
  ListPublicShopProductsQuery,
  ListPublicShopsQuery,
} from '../application/queries';
import {
  PublicShopArticleSlugDto,
  PublicShopCampaignSlugDto,
} from './dto/public-shop-content-slug.dto';
import { PublicShopSlugDto } from './dto/public-shop-slug.dto';
import { ListPublicShopsQueryDto } from './dto/list-public-shops-query.dto';
import { ListPublicShopProductsQueryDto } from './dto/list-public-shop-products-query.dto';

@ApiTags('🏪 Public - Shops')
@Controller({ path: 'shops', version: '1' })
export class PublicShopController {
  constructor(
    private readonly listPublicShopsQuery: ListPublicShopsQuery,
    private readonly listPublicShopProductsQuery: ListPublicShopProductsQuery,
    private readonly listPublicShopCampaignsQuery: ListPublicShopCampaignsQuery,
    private readonly listPublicShopArticlesQuery: ListPublicShopArticlesQuery,
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
  @ApiOperation({ summary: 'Get shop campaign highlights' })
  @Get(':slug/campaigns/highlights')
  async getCampaignHighlights(@Param() params: PublicShopSlugDto) {
    const data = await this.listPublicShopCampaignsQuery.getHighlights(
      params.slug,
    );
    return this.responseService.success({
      message: 'Campaign highlights retrieved successfully',
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get shop campaign detail' })
  @Get(':slug/campaigns/:campaignSlug')
  async getCampaignDetail(
    @Param() params: PublicShopCampaignSlugDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.listPublicShopCampaignsQuery.getDetail(
      params.slug,
      params.campaignSlug,
      lang,
    );
    return this.responseService.success({
      message: 'Campaign retrieved successfully',
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'List shop campaigns' })
  @Get(':slug/campaigns')
  async listCampaigns(
    @Param() params: PublicShopSlugDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.listPublicShopCampaignsQuery.execute(
      params.slug,
      lang,
    );
    return this.responseService.success({
      message: 'Campaigns retrieved successfully',
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get shop article detail' })
  @Get(':slug/articles/:articleSlug')
  async getArticleDetail(
    @Param() params: PublicShopArticleSlugDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.listPublicShopArticlesQuery.getDetail(
      params.slug,
      params.articleSlug,
      lang,
    );
    return this.responseService.success({
      message: 'Article retrieved successfully',
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'List shop articles' })
  @Get(':slug/articles')
  async listArticles(
    @Param() params: PublicShopSlugDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.listPublicShopArticlesQuery.execute(
      params.slug,
      lang,
    );
    return this.responseService.success({
      message: 'Articles retrieved successfully',
      data,
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
