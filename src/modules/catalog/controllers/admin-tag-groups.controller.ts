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
  CreateTagCommand,
  CreateTagGroupCommand,
  DeleteTagGroupCommand,
  DeleteTagGroupTranslationCommand,
  UpdateTagGroupCommand,
  UpsertTagGroupTranslationCommand,
} from '../application/commands';
import {
  GetAdminTagGroupByIdQuery,
  ListAdminTagGroupsQuery,
  ListAdminTagsQuery,
  ListTagGroupTranslationsQuery,
} from '../application/queries';
import { CreateTagDto } from './dto/create-tag.dto';
import { CreateTagGroupDto } from './dto/create-tag-group.dto';
import { TagGroupParamDto } from './dto/tag-group-param.dto';
import { TagGroupQueryDto } from './dto/tag-group-query.dto';
import { TagGroupTranslationParamDto } from './dto/tag-group-translation-param.dto';
import { TagQueryDto } from './dto/tag-query.dto';
import { UpdateTagGroupDto } from './dto/update-tag-group.dto';
import { UpsertTagGroupTranslationDto } from './dto/upsert-tag-group-translation.dto';

@ApiTags('🏷️ Admin - Taxonomy')
@UseGuards(AdminAuthGuard)
@ApiAuth()
@Controller('admin/tag-groups')
export class AdminTagGroupsController {
  constructor(
    private readonly createTagGroupCommand: CreateTagGroupCommand,
    private readonly listAdminTagGroupsQuery: ListAdminTagGroupsQuery,
    private readonly getAdminTagGroupByIdQuery: GetAdminTagGroupByIdQuery,
    private readonly updateTagGroupCommand: UpdateTagGroupCommand,
    private readonly deleteTagGroupCommand: DeleteTagGroupCommand,
    private readonly listTagGroupTranslationsQuery: ListTagGroupTranslationsQuery,
    private readonly upsertTagGroupTranslationCommand: UpsertTagGroupTranslationCommand,
    private readonly deleteTagGroupTranslationCommand: DeleteTagGroupTranslationCommand,
    private readonly createTagCommand: CreateTagCommand,
    private readonly listAdminTagsQuery: ListAdminTagsQuery,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'Create a new tag group' })
  @ApiResponse({ status: 201, description: 'Tag Group created' })
  @ApiBadRequestResponse()
  @Post()
  async create(@Body() createTagGroupDto: CreateTagGroupDto) {
    const data = await this.createTagGroupCommand.execute(createTagGroupDto);
    return this.responseService.success({
      message: 'Tag Group created successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Get all tag groups' })
  @ApiResponse({ status: 200, description: 'Tag Groups retrieved' })
  @ApiPagination()
  @Get()
  async findAll(@Query() query: TagGroupQueryDto, @I18nLang() lang: string) {
    const list = await this.listAdminTagGroupsQuery.execute(query, lang);
    return this.responseService.paginated({
      message: 'Tag Groups retrieved successfully',
      data: list.data,
      meta: list.meta,
    });
  }

  @ApiOperation({ summary: 'Get a tag group by ID' })
  @ApiResponse({ status: 200, description: 'Tag Group retrieved' })
  @ApiNotFoundResponse('Tag Group')
  @Get(':groupId')
  async findOne(@Param() param: TagGroupParamDto, @I18nLang() lang: string) {
    const data = await this.getAdminTagGroupByIdQuery.execute(
      param.groupId,
      lang,
    );
    return this.responseService.success({
      message: 'Tag Group retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Update a tag group' })
  @ApiResponse({ status: 200, description: 'Tag Group updated' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Tag Group')
  @Patch(':groupId')
  async update(
    @Param() param: TagGroupParamDto,
    @Body() updateTagGroupDto: UpdateTagGroupDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.updateTagGroupCommand.execute(
      param.groupId,
      updateTagGroupDto,
      lang,
    );
    return this.responseService.success({
      message: 'Tag Group updated successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Delete a tag group' })
  @ApiResponse({ status: 200, description: 'Tag Group deleted' })
  @ApiNotFoundResponse('Tag Group')
  @Delete(':groupId')
  async remove(@Param() param: TagGroupParamDto, @I18nLang() lang: string) {
    await this.deleteTagGroupCommand.execute(param.groupId, lang);
    return this.responseService.success({
      message: 'Tag Group removed successfully',
      data: null,
    });
  }

  @ApiOperation({ summary: 'Get tag group translations' })
  @ApiResponse({ status: 200, description: 'Translations retrieved' })
  @Get(':groupId/translations')
  async findAllGroupTranslations(@Param() param: TagGroupParamDto) {
    const data = await this.listTagGroupTranslationsQuery.execute(
      param.groupId,
    );
    return this.responseService.success({
      data,
      message: 'Tag Group translations retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Upsert tag group translation' })
  @ApiResponse({ status: 201, description: 'Translation created' })
  @ApiResponse({ status: 200, description: 'Translation updated' })
  @Post(':groupId/translations')
  async upsertGroupTranslation(
    @Param() param: TagGroupParamDto,
    @Body() upsertDto: UpsertTagGroupTranslationDto,
  ) {
    const data = await this.upsertTagGroupTranslationCommand.execute(
      param.groupId,
      upsertDto,
    );
    return this.responseService.success({
      data,
      message: 'Tag Group translation saved successfully',
    });
  }

  @ApiOperation({ summary: 'Delete tag group translation' })
  @ApiResponse({ status: 200, description: 'Translation deleted' })
  @Delete(':groupId/translations/:locale')
  async removeGroupTranslation(@Param() param: TagGroupTranslationParamDto) {
    await this.deleteTagGroupTranslationCommand.execute(
      param.groupId,
      param.locale,
    );
    return this.responseService.success({
      data: null,
      message: 'Tag Group translation deleted successfully',
    });
  }

  @ApiOperation({ summary: 'Create a tag in the group' })
  @ApiResponse({ status: 201, description: 'Tag created' })
  @Post(':groupId/tags')
  async createTag(
    @Param() param: TagGroupParamDto,
    @Body() createTagDto: CreateTagDto,
  ) {
    const tagData: CreateTagDto = { ...createTagDto, groupId: param.groupId };
    const data = await this.createTagCommand.execute(tagData);
    return this.responseService.success({
      message: 'Tag created successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Get all tags in the group' })
  @ApiResponse({ status: 200, description: 'Tags retrieved' })
  @Get(':groupId/tags')
  async findAllTags(
    @Param() param: TagGroupParamDto,
    @Query() query: TagQueryDto,
  ) {
    query.groupId = param.groupId;
    const list = await this.listAdminTagsQuery.execute(query);
    return this.responseService.paginated({
      message: 'Tags retrieved successfully',
      data: list.data,
      meta: list.meta,
    });
  }
}
