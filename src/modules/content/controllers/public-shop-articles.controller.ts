import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import { ApiNotFoundResponse } from '@/common/decorators/api-error.decorator';
import { ResponseService } from '@/common/modules/response/response.service';
import {
  GetPublicShopArticleQuery,
  ListPublicShopArticlesQuery,
} from '../application/queries';
import { PublicShopArticleSlugDto, PublicShopSlugDto } from './dto';

@ApiTags('🏪 Public - Shops')
@Controller({ path: 'shops', version: '1' })
export class PublicShopArticlesController {
  constructor(
    private readonly listPublicShopArticlesQuery: ListPublicShopArticlesQuery,
    private readonly getPublicShopArticleQuery: GetPublicShopArticleQuery,
    private readonly responseService: ResponseService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'Get shop article detail' })
  @ApiNotFoundResponse('Shop')
  @Get(':slug/articles/:articleSlug')
  async getArticleDetail(
    @Param() params: PublicShopArticleSlugDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getPublicShopArticleQuery.execute(
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
  @ApiResponse({ status: 200, description: 'Articles retrieved' })
  @ApiNotFoundResponse('Shop')
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
}
