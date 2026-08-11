import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ProductStatusEnum, TProductStatus } from '@/_db/drizzle/enum';
import { AuthenticUser } from '@/common/decorators/authentic-user.decorator';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@/common/decorators/api-error.decorator';
import {
  ApiAuth,
  ApiPaginatedResponse,
} from '@/common/decorators/swagger.decorators';
import { VerifiedUserAuthGuard } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { ResponseService } from '@/common/modules/response/response.service';
import { TAuthenticUser } from '@/common/types';
import { ShopQueryService } from '@/modules/shop/application/queries';
import {
  CreatePlantCommand,
  DeletePlantCommand,
  UpdatePlantCommand,
  UpdatePlantStatusCommand,
} from '../application/commands';
import {
  GetSellerPlantByIdQuery,
  ListSellerPlantsQuery,
} from '../application/queries';
import { CreatePlantDto } from './dto/create-plant.dto';
import { GetPlantByIdParamsDto } from './dto/get-plant-by-id-params.dto';
import { ListPlantsQueryDto } from './dto/list-plants-query.dto';
import {
  PlantListItemResponseDto,
  PlantCreateResponseDto,
  PlantDetailResponseDto,
} from './dto/plants-response.dto';
import { UpdatePlantStatusDto } from './dto/update-plant-status.dto';
import {
  assertNoStockFieldsOnUpdate,
  isStatusOnlyPlantUpdate,
  UpdatePlantDto,
} from './dto/update-plant.dto';

@ApiTags('🌱 Seller - Plants Management')
@Controller({ path: 'user/seller/plants', version: '1' })
export class SellerPlantsController {
  constructor(
    private readonly listSellerPlantsQuery: ListSellerPlantsQuery,
    private readonly getSellerPlantByIdQuery: GetSellerPlantByIdQuery,
    private readonly createPlantCommand: CreatePlantCommand,
    private readonly updatePlantCommand: UpdatePlantCommand,
    private readonly updatePlantStatusCommand: UpdatePlantStatusCommand,
    private readonly deletePlantCommand: DeletePlantCommand,
    private readonly shopQueryService: ShopQueryService,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'List plants',
    description:
      'Returns a paginated list of plants for the authenticated seller',
  })
  @ApiPaginatedResponse(PlantListItemResponseDto)
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or slug',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProductStatusEnum,
    description: 'Filter by product status',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'tagIds',
    required: false,
    type: String,
    description: 'Comma-separated tag UUIDs',
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
  async getPlants(
    @Query() query: ListPlantsQueryDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const result = await this.listSellerPlantsQuery.execute(
      authenticUser.user.id,
      query,
      lang,
    );
    return this.responseService.paginated({
      message: this.i18n.t('message.success.plantsRetrieved', { lang }),
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get plant by ID',
    description:
      'Returns full plant details including variants, care instructions, and all translations',
  })
  @ApiResponse({
    status: 200,
    description: 'Plant details retrieved successfully',
    type: PlantDetailResponseDto,
  })
  @ApiBadRequestResponse('Validation failed')
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Plant not found')
  @Get(':id')
  @UseGuards(VerifiedUserAuthGuard)
  async getPlantById(
    @Param() params: GetPlantByIdParamsDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const plant = await this.getSellerPlantByIdQuery.execute(
      authenticUser.user.id,
      params.id,
      lang,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.plantRetrieved', { lang }),
      data: plant,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Create plant',
    description:
      'Creates a new plant product with variants, care instructions, and media',
  })
  @ApiResponse({
    status: 201,
    description: 'Plant created successfully',
    type: PlantCreateResponseDto,
  })
  @ApiBadRequestResponse('Validation failed')
  @ApiUnauthorizedResponse()
  @ApiConflictResponse('Slug already exists')
  @Post()
  @UseGuards(VerifiedUserAuthGuard)
  async createPlant(
    @Body() dto: CreatePlantDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const shop = await this.resolveShop(authenticUser.user.id, lang);
    const plant = await this.createPlantCommand.execute(
      shop.id,
      authenticUser.user.id,
      dto,
      lang,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.plantCreated', { lang }),
      data: plant,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Update plant',
    description:
      'Updates a plant listing. Send full catalog body or status-only for quick publish/archive.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plant updated successfully',
    type: PlantDetailResponseDto,
  })
  @ApiBadRequestResponse('Validation failed')
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Plant not found')
  @ApiConflictResponse('Slug or SKU already exists')
  @Patch(':id')
  @UseGuards(VerifiedUserAuthGuard)
  async updatePlant(
    @Param() params: GetPlantByIdParamsDto,
    @Body() body: Record<string, unknown>,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    this.guardAgainstStockFieldsOnUpdate(body, lang);

    if (isStatusOnlyPlantUpdate(body)) {
      const statusDto = body as unknown as UpdatePlantStatusDto;
      const plant = await this.updatePlantStatusCommand.execute(
        authenticUser.user.id,
        params.id,
        statusDto.status as TProductStatus,
        lang,
      );
      return this.responseService.success({
        message: this.i18n.t('message.success.plantUpdated', { lang }),
        data: plant,
      });
    }

    const shop = await this.resolveShop(authenticUser.user.id, lang);
    await this.updatePlantCommand.execute(
      shop.id,
      authenticUser.user.id,
      params.id,
      body as unknown as UpdatePlantDto,
      lang,
    );
    const plant = await this.getSellerPlantByIdQuery.executeForShop(
      shop.id,
      params.id,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.plantUpdated', { lang }),
      data: plant,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Delete plant',
    description: 'Soft-deletes a plant by setting status to ARCHIVED',
  })
  @ApiResponse({ status: 200, description: 'Plant deleted successfully' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Plant not found')
  @Delete(':id')
  @UseGuards(VerifiedUserAuthGuard)
  async deletePlant(
    @Param() params: GetPlantByIdParamsDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    await this.deletePlantCommand.execute(
      authenticUser.user.id,
      params.id,
      lang,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.plantDeleted', { lang }),
      data: null,
    });
  }

  private guardAgainstStockFieldsOnUpdate(body: unknown, lang: string): void {
    try {
      assertNoStockFieldsOnUpdate(body);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('STOCK_FIELD:')) {
        throw new CustomException({
          message: this.i18n.t(
            'message.error.stockFieldNotAllowedOnCatalogUpdate',
            { lang },
          ),
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.VALIDATION_ERROR,
        });
      }
      throw error;
    }
  }

  private async resolveShop(userId: string, lang: string) {
    const shop = await this.shopQueryService.getShopByOwnerId(userId);
    if (!shop) {
      throw new CustomException({
        message: this.i18n.t('message.error.shopNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }
    return shop;
  }
}
