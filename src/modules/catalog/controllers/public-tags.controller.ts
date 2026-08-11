import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import { ApiNotFoundResponse } from '@/common/decorators/api-error.decorator';
import {
  GetPublicTagByIdQuery,
  ListPublicTagsQuery,
} from '../application/queries';
import { GetTagByIdParamsDto } from './dto/get-tag-by-id-params.dto';

@ApiTags('🏷️ Public - Tags')
@Controller({ path: 'tags', version: '1' })
export class PublicTagsController {
  constructor(
    private readonly listPublicTagsQuery: ListPublicTagsQuery,
    private readonly getPublicTagByIdQuery: GetPublicTagByIdQuery,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'Get all active tags grouped by group',
    description: 'Returns all active tags organized by their tag groups',
  })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['en', 'bn'],
    default: 'en',
    description: 'Response language',
  })
  @Get()
  async findAll(@I18nLang() lang: string) {
    const data = await this.listPublicTagsQuery.execute(lang);
    return { success: true, message: 'Tags retrieved', data };
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get tag by ID',
    description: 'Returns a single tag with translations',
  })
  @ApiResponse({ status: 200, description: 'Tag retrieved successfully' })
  @ApiNotFoundResponse('Tag not found')
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @Get(':id')
  async findOne(
    @Param() params: GetTagByIdParamsDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getPublicTagByIdQuery.execute(params.id, lang);
    return { success: true, message: 'Tag retrieved', data };
  }
}
