import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { VerifiedUserAuthGuard } from '@/libs/guards/verified-user-auth-guard/verified-user-auth.guard';
import { SellerShopGuard } from '@/libs/guards/seller-shop-guard/seller-shop.guard';
import { AuthenticShop } from '@/libs/decorators/authentic-shop.decorator';
import { TAuthorizedShop } from '@/libs/types';
import { ResponseService } from '@/libs/modules/response/response.service';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ArchiveArticleCommand,
  CreateArticleCommand,
  DeleteArticleCommand,
  SubmitArticleCommand,
  UpdateArticleCommand,
} from '../application/commands';
import {
  GetSellerArticleQuery,
  ListSellerArticlesQuery,
} from '../application/queries';
import {
  ArticleIdParamDto,
  CreateArticleDto,
  ListArticlesQueryDto,
  UpdateArticleDto,
} from './dto';

@ApiTags('📰 Seller - Articles')
@Controller({ path: 'user/seller/articles', version: '1' })
export class SellerArticlesController {
  constructor(
    private readonly listSellerArticlesQuery: ListSellerArticlesQuery,
    private readonly getSellerArticleQuery: GetSellerArticleQuery,
    private readonly createArticleCommand: CreateArticleCommand,
    private readonly updateArticleCommand: UpdateArticleCommand,
    private readonly submitArticleCommand: SubmitArticleCommand,
    private readonly archiveArticleCommand: ArchiveArticleCommand,
    private readonly deleteArticleCommand: DeleteArticleCommand,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'List seller articles' })
  @Get()
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async list(
    @AuthenticShop() shop: TAuthorizedShop,
    @Query() query: ListArticlesQueryDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.listSellerArticlesQuery.execute(shop.id, query);
    return this.responseService.paginated({
      message: this.i18n.t('message.success.articlesRetrieved', {
        lang,
        defaultValue: 'Articles retrieved successfully',
      }),
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get article detail' })
  @Get(':id')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async get(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: ArticleIdParamDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getSellerArticleQuery.execute(shop.id, params.id);
    return this.responseService.success({
      message: this.i18n.t('message.success.articleRetrieved', {
        lang,
        defaultValue: 'Article retrieved successfully',
      }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Create article draft' })
  @Post()
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async create(
    @AuthenticShop() shop: TAuthorizedShop,
    @Body() dto: CreateArticleDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.createArticleCommand.execute(shop.id, dto);
    return this.responseService.success({
      message: this.i18n.t('message.success.articleCreated', {
        lang,
        defaultValue: 'Article created successfully',
      }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Update article' })
  @Patch(':id')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async update(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: ArticleIdParamDto,
    @Body() dto: UpdateArticleDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.updateArticleCommand.execute(
      shop.id,
      params.id,
      dto,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.articleUpdated', {
        lang,
        defaultValue: 'Article updated successfully',
      }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Submit article for review' })
  @Post(':id/submit')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async submit(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: ArticleIdParamDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.submitArticleCommand.execute(
      shop.id,
      params.id,
      shop.status,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.articleSubmitted', {
        lang,
        defaultValue: 'Article submitted for review',
      }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Archive article' })
  @Post(':id/archive')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async archive(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: ArticleIdParamDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.archiveArticleCommand.execute(shop.id, params.id);
    return this.responseService.success({
      message: this.i18n.t('message.success.articleArchived', {
        lang,
        defaultValue: 'Article archived successfully',
      }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Delete article' })
  @Delete(':id')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async delete(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: ArticleIdParamDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.deleteArticleCommand.execute(shop.id, params.id);
    return this.responseService.success({
      message: this.i18n.t('message.success.articleDeleted', {
        lang,
        defaultValue: 'Article deleted successfully',
      }),
      data,
    });
  }
}
