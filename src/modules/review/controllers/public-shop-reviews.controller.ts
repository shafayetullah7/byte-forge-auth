import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import { ApiNotFoundResponse } from '@/common/decorators/api-error.decorator';
import { ResponseService } from '@/common/modules/response/response.service';
import { GetPublicShopReviewsQuery } from '../application/queries/get-public-shop-reviews.query';
import { ListPublicShopReviewsQueryDto } from './dto/list-public-shop-reviews-query.dto';
import { PublicShopSlugDto } from './dto/public-shop-slug.dto';

@ApiTags('🏪 Public - Shops')
@Controller({ path: 'shops', version: '1' })
export class PublicShopReviewsController {
  constructor(
    private readonly getPublicShopReviewsQuery: GetPublicShopReviewsQuery,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'Get shop reviews by slug' })
  @ApiResponse({ status: 200, description: 'Shop reviews retrieved' })
  @ApiNotFoundResponse('Shop')
  @Get(':slug/reviews')
  async listShopReviews(
    @Param() params: PublicShopSlugDto,
    @Query() query: ListPublicShopReviewsQueryDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.getPublicShopReviewsQuery.execute(
      params.slug,
      query,
      lang,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.shopReviewsRetrieved', {
        lang,
        defaultValue: 'Shop reviews retrieved successfully',
      }),
      data: result,
    });
  }
}
