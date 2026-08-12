import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseService } from '@/common/modules/response/response.service';
import {
  GetPublicPlantReviewsQuery,
  GetPublicProductReviewsQuery,
  ListFeaturedPublicReviewsQuery,
} from '../application/queries';
import {
  PlantReviewParamDto,
  ProductReviewParamDto,
  PublicReviewQueryDto,
} from './dto';

@ApiTags('⭐ Public Reviews')
@Controller({ path: 'reviews', version: '1' })
export class PublicReviewsController {
  constructor(
    private readonly getPublicProductReviewsQuery: GetPublicProductReviewsQuery,
    private readonly getPublicPlantReviewsQuery: GetPublicPlantReviewsQuery,
    private readonly listFeaturedPublicReviewsQuery: ListFeaturedPublicReviewsQuery,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'List approved reviews for a product' })
  @Get('products/:productId')
  async getProductReviews(
    @Param() params: ProductReviewParamDto,
    @Query() query: PublicReviewQueryDto,
  ) {
    const data = await this.getPublicProductReviewsQuery.execute(
      params.productId,
      query,
    );

    return this.responseService.success({
      message: 'Product reviews retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'List approved reviews for a plant slug' })
  @Get('plants/:slug')
  async getPlantReviews(
    @Param() params: PlantReviewParamDto,
    @Query() query: PublicReviewQueryDto,
  ) {
    const data = await this.getPublicPlantReviewsQuery.execute(
      params.slug,
      query,
    );

    return this.responseService.success({
      message: 'Plant reviews retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'List featured reviews for landing pages' })
  @Get('featured')
  async getFeaturedReviews(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 10);
    const data = await this.listFeaturedPublicReviewsQuery.execute(
      Number.isFinite(parsedLimit) ? parsedLimit : 10,
    );

    return this.responseService.success({
      message: 'Featured reviews retrieved successfully',
      data,
    });
  }
}
