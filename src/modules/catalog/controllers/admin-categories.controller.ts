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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { ResponseService } from '@/libs/modules/response/response.service';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@/libs/decorators/api-error.decorator';
import { ApiPagination } from '@/libs/decorators/api-pagination.decorator';
import {
  CreateCategoryCommand,
  DeleteCategoryCommand,
  DeleteCategoryTranslationCommand,
  UpdateCategoryCommand,
  UpsertCategoryTranslationCommand,
} from '../application/commands';
import {
  GetAdminCategoryAncestorsQuery,
  GetAdminCategoryByIdQuery,
  GetAdminCategoryTreeQuery,
  ListAdminCategoriesQuery,
  ListCategoryTranslationsQuery,
} from '../application/queries';
import { CategoryParamDto } from './dto/category-param.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CategoryTranslationListParamDto } from './dto/category-translation-list-param.dto';
import { CategoryTranslationParamDto } from './dto/category-translation-param.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpsertCategoryTranslationDto } from './dto/upsert-category-translation.dto';

@ApiTags('🏷️ Admin - Taxonomy')
@UseGuards(AdminAuthGuard)
@ApiAuth()
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    private readonly createCategoryCommand: CreateCategoryCommand,
    private readonly listAdminCategoriesQuery: ListAdminCategoriesQuery,
    private readonly getAdminCategoryTreeQuery: GetAdminCategoryTreeQuery,
    private readonly getAdminCategoryAncestorsQuery: GetAdminCategoryAncestorsQuery,
    private readonly getAdminCategoryByIdQuery: GetAdminCategoryByIdQuery,
    private readonly updateCategoryCommand: UpdateCategoryCommand,
    private readonly deleteCategoryCommand: DeleteCategoryCommand,
    private readonly listCategoryTranslationsQuery: ListCategoryTranslationsQuery,
    private readonly upsertCategoryTranslationCommand: UpsertCategoryTranslationCommand,
    private readonly deleteCategoryTranslationCommand: DeleteCategoryTranslationCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiBadRequestResponse()
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const data = await this.createCategoryCommand.execute(createCategoryDto);
    return this.responseService.success({
      message: 'Category created successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved' })
  @ApiPagination()
  @Get()
  async findAll(@Query() query: CategoryQueryDto, @I18nLang() lang: string) {
    const list = await this.listAdminCategoriesQuery.execute(query, lang);
    return this.responseService.paginated({
      message: 'Categories retrieved successfully',
      data: list.data,
      meta: list.meta,
    });
  }

  @ApiOperation({ summary: 'Get category tree' })
  @ApiResponse({ status: 200, description: 'Category tree retrieved' })
  @Get('tree')
  async getTree(@I18nLang() lang: string) {
    const data = await this.getAdminCategoryTreeQuery.execute(lang);
    return this.responseService.success({
      message: 'Category tree retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Get category ancestors' })
  @ApiResponse({ status: 200, description: 'Category ancestors retrieved' })
  @Get(':id/ancestors')
  async getAncestors(@Param() param: CategoryParamDto) {
    const data = await this.getAdminCategoryAncestorsQuery.execute(param.id);
    return this.responseService.success({
      message: 'Category ancestors retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved' })
  @ApiNotFoundResponse('Category')
  @Get(':id')
  async findOne(@Param() param: CategoryParamDto, @I18nLang() lang: string) {
    const data = await this.getAdminCategoryByIdQuery.execute(param.id, lang);
    return this.responseService.success({
      message: 'Category retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Category')
  @Patch(':id')
  async update(
    @Param() param: CategoryParamDto,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.updateCategoryCommand.execute(
      param.id,
      updateCategoryDto,
      lang,
    );
    return this.responseService.success({
      message: 'Category updated successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiNotFoundResponse('Category')
  @Delete(':id')
  async remove(@Param() param: CategoryParamDto, @I18nLang() lang: string) {
    await this.deleteCategoryCommand.execute(param.id, lang);
    return this.responseService.success({
      message: 'Category removed successfully',
      data: null,
    });
  }

  @ApiOperation({ summary: 'Get category translations' })
  @ApiResponse({ status: 200, description: 'Translations retrieved' })
  @Get(':category_id/translations')
  async findAllTranslations(@Param() param: CategoryTranslationListParamDto) {
    const data = await this.listCategoryTranslationsQuery.execute(
      param.category_id,
    );
    return this.responseService.success({
      message: 'Category translations retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Upsert category translation' })
  @ApiResponse({ status: 201, description: 'Translation created' })
  @ApiResponse({ status: 200, description: 'Translation updated' })
  @Post(':category_id/translations')
  async upsertTranslation(
    @Param() param: CategoryTranslationListParamDto,
    @Body() upsertDto: UpsertCategoryTranslationDto,
  ) {
    const data = await this.upsertCategoryTranslationCommand.execute(
      param.category_id,
      upsertDto,
    );
    return this.responseService.success({
      message: 'Category translation saved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Delete category translation' })
  @ApiResponse({ status: 200, description: 'Translation deleted' })
  @Delete(':category_id/translations/:locale')
  async removeTranslation(@Param() param: CategoryTranslationParamDto) {
    await this.deleteCategoryTranslationCommand.execute(
      param.category_id,
      param.locale,
    );
    return this.responseService.success({
      message: 'Category translation deleted successfully',
      data: null,
    });
  }
}
