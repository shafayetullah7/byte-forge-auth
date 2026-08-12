import {
  Controller,
  Get,
  Logger,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ProductStatusEnum, ProductTypeEnum } from '@/_db/drizzle/enum';
import { AuthenticUser } from '@/libs/decorators/authentic-user.decorator';
import {
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@/libs/decorators/api-error.decorator';
import {
  ApiAuth,
  ApiPaginatedResponse,
} from '@/libs/decorators/swagger.decorators';
import { VerifiedUserAuthGuard } from '@/libs/guards/verified-user-auth-guard/verified-user-auth.guard';
import { ResponseService } from '@/libs/modules/response/response.service';
import { TAuthenticUser } from '@/libs/types';
import {
  GetSellerProductByIdQuery,
  GetSellerProductOverviewQuery,
  GetSellerProductSummaryQuery,
  ListSellerProductsQuery,
} from '../application/queries';
import { GetProductByIdParamsDto } from './dto/get-product-by-id-params.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import {
  ProductDetailResponseDto,
  ProductListItemResponseDto,
  ProductOverviewResponseDto,
  ProductSummaryResponseDto,
} from './dto/products-response.dto';

@ApiTags('📦 Seller - Products Management')
@Controller({ path: 'user/seller/products', version: '1' })
export class SellerProductsController {
  private readonly logger = new Logger(SellerProductsController.name);

  constructor(
    private readonly listSellerProductsQuery: ListSellerProductsQuery,
    private readonly getSellerProductByIdQuery: GetSellerProductByIdQuery,
    private readonly getSellerProductSummaryQuery: GetSellerProductSummaryQuery,
    private readonly getSellerProductOverviewQuery: GetSellerProductOverviewQuery,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'List products',
    description:
      'Returns a paginated list of all products for the authenticated seller',
  })
  @ApiPaginatedResponse(ProductListItemResponseDto)
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or slug',
  })
  @ApiQuery({
    name: 'productType',
    required: false,
    enum: ProductTypeEnum,
    description: 'Filter by product type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProductStatusEnum,
    description: 'Filter by product status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'name', 'price', 'inventory'],
    default: 'createdAt',
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort direction',
  })
  @ApiUnauthorizedResponse()
  @Get()
  @UseGuards(VerifiedUserAuthGuard)
  async getProducts(
    @Query() query: ListProductsQueryDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    this.logger.log(
      `Fetching products for user ${authenticUser.user.id} | Query: ${JSON.stringify(query)}`,
    );
    try {
      const result = await this.listSellerProductsQuery.execute(
        authenticUser.user.id,
        query,
        lang,
      );
      this.logger.log(`Successfully fetched ${result.data.length} products`);
      return this.responseService.paginated({
        message: this.i18n.t('message.success.productsRetrieved', { lang }),
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch products for user ${authenticUser.user.id} | Query: ${JSON.stringify(query)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get product by ID',
    description:
      'Returns full product details including thumbnail and variant information',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details retrieved successfully',
    type: ProductDetailResponseDto,
  })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Product not found')
  @Get(':id')
  @UseGuards(VerifiedUserAuthGuard)
  async getProductById(
    @Param() params: GetProductByIdParamsDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const { id } = params;
    this.logger.log(`Fetching product ${id} for user ${authenticUser.user.id}`);
    try {
      const product = await this.getSellerProductByIdQuery.execute(
        authenticUser.user.id,
        id,
        lang,
      );
      this.logger.log(`Successfully fetched product ${id}`);
      return this.responseService.success({
        message: this.i18n.t('message.success.productRetrieved', { lang }),
        data: product,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch product ${id} for user ${authenticUser.user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get product summary',
    description:
      'Returns lightweight product info for layout header (id, slug, type, status, translations)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product summary retrieved successfully',
    type: ProductSummaryResponseDto,
  })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Product not found')
  @Get(':id/summary')
  @UseGuards(VerifiedUserAuthGuard)
  async getProductSummary(
    @Param() params: GetProductByIdParamsDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const { id } = params;
    this.logger.log(
      `Fetching product summary ${id} for user ${authenticUser.user.id}`,
    );
    try {
      const summary = await this.getSellerProductSummaryQuery.execute(
        authenticUser.user.id,
        id,
        lang,
      );
      this.logger.log(`Successfully fetched product summary ${id}`);
      return this.responseService.success({
        message: this.i18n.t('message.success.productRetrieved', { lang }),
        data: summary,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch product summary ${id} for user ${authenticUser.user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get product overview',
    description:
      'Returns product overview data (thumbnail, variants, stock breakdown)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product overview retrieved successfully',
    type: ProductOverviewResponseDto,
  })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Product not found')
  @Get(':id/overview')
  @UseGuards(VerifiedUserAuthGuard)
  async getProductOverview(
    @Param() params: GetProductByIdParamsDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const { id } = params;
    this.logger.log(
      `Fetching product overview ${id} for user ${authenticUser.user.id}`,
    );
    try {
      const overview = await this.getSellerProductOverviewQuery.execute(
        authenticUser.user.id,
        id,
        lang,
      );
      this.logger.log(`Successfully fetched product overview ${id}`);
      return this.responseService.success({
        message: this.i18n.t('message.success.productRetrieved', { lang }),
        data: overview,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch product overview ${id} for user ${authenticUser.user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
