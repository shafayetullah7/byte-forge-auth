import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import { ApiNotFoundResponse } from '@/libs/decorators/api-error.decorator';
import {
  GetPublicCategoryByIdQuery,
  GetPublicCategoryTreeQuery,
  ListPublicCategoriesQuery,
} from '../application/queries';
import { GetCategoryByIdParamsDto } from './dto/get-category-by-id-params.dto';

@ApiTags('📂 Public - Categories')
@Controller({ path: 'tree-categories', version: '1' })
export class PublicCategoriesController {
  constructor(
    private readonly listPublicCategoriesQuery: ListPublicCategoriesQuery,
    private readonly getPublicCategoryTreeQuery: GetPublicCategoryTreeQuery,
    private readonly getPublicCategoryByIdQuery: GetPublicCategoryByIdQuery,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'Get all active categories',
    description: 'Returns a list of all active categories with translations',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['en', 'bn'],
    default: 'en',
    description: 'Response language',
  })
  @Get()
  async findAll(@I18nLang() lang: string) {
    const data = await this.listPublicCategoriesQuery.execute(lang);
    return { success: true, message: 'Categories retrieved', data };
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get category tree',
    description: 'Returns a hierarchical tree of all active categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Category tree retrieved successfully',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['en', 'bn'],
    default: 'en',
    description: 'Response language',
  })
  @Get('tree')
  async getTree(@I18nLang() lang: string) {
    const data = await this.getPublicCategoryTreeQuery.execute(lang);
    return { success: true, message: 'Category tree retrieved', data };
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Returns a single category with translations',
  })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiNotFoundResponse('Category not found')
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @Get(':id')
  async findOne(
    @Param() params: GetCategoryByIdParamsDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getPublicCategoryByIdQuery.execute(params.id, lang);
    return { success: true, message: 'Category retrieved', data };
  }
}
