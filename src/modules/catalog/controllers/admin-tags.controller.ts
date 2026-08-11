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
import { AdminAuthGuard } from '@/common/guards/admin-auth-guard/admin-auth.guard';
import { ResponseService } from '@/common/modules/response/response.service';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@/common/decorators/api-error.decorator';
import { ApiPagination } from '@/common/decorators/api-pagination.decorator';
import {
  DeleteTagCommand,
  DeleteTagTranslationCommand,
  UpdateTagCommand,
  UpsertTagTranslationCommand,
} from '../application/commands';
import {
  GetAdminTagByIdQuery,
  ListAdminTagsQuery,
  ListTagTranslationsQuery,
} from '../application/queries';
import { TagParamDto } from './dto/tag-param.dto';
import { TagQueryDto } from './dto/tag-query.dto';
import { TagTranslationParamDto } from './dto/tag-translation-param.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { UpsertTagTranslationDto } from './dto/upsert-tag-translation.dto';

@ApiTags('🏷️ Admin - Taxonomy')
@UseGuards(AdminAuthGuard)
@ApiAuth()
@Controller('admin/tags')
export class AdminTagsController {
  constructor(
    private readonly listAdminTagsQuery: ListAdminTagsQuery,
    private readonly getAdminTagByIdQuery: GetAdminTagByIdQuery,
    private readonly updateTagCommand: UpdateTagCommand,
    private readonly deleteTagCommand: DeleteTagCommand,
    private readonly listTagTranslationsQuery: ListTagTranslationsQuery,
    private readonly upsertTagTranslationCommand: UpsertTagTranslationCommand,
    private readonly deleteTagTranslationCommand: DeleteTagTranslationCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'Tags retrieved' })
  @ApiPagination()
  @Get()
  async findAll(@Query() query: TagQueryDto) {
    const list = await this.listAdminTagsQuery.execute(query);
    return this.responseService.paginated({
      message: 'Tags retrieved successfully',
      data: list.data,
      meta: list.meta,
    });
  }

  @ApiOperation({ summary: 'Get a tag by ID' })
  @ApiResponse({ status: 200, description: 'Tag retrieved' })
  @ApiNotFoundResponse('Tag')
  @Get(':tagId')
  async findOne(@Param() param: TagParamDto) {
    const data = await this.getAdminTagByIdQuery.execute(param.tagId);
    return this.responseService.success({
      message: 'Tag retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({ status: 200, description: 'Tag updated' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Tag')
  @Patch(':tagId')
  async update(
    @Param() param: TagParamDto,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    const data = await this.updateTagCommand.execute(param.tagId, updateTagDto);
    return this.responseService.success({
      message: 'Tag updated successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ status: 200, description: 'Tag deleted' })
  @ApiNotFoundResponse('Tag')
  @Delete(':tagId')
  async remove(@Param() param: TagParamDto) {
    await this.deleteTagCommand.execute(param.tagId);
    return this.responseService.success({
      message: 'Tag removed successfully',
      data: null,
    });
  }

  @ApiOperation({ summary: 'Get tag translations' })
  @ApiResponse({ status: 200, description: 'Translations retrieved' })
  @Get(':tagId/translations')
  async findAllTagTranslations(@Param() param: TagParamDto) {
    const data = await this.listTagTranslationsQuery.execute(param.tagId);
    return this.responseService.success({
      data,
      message: 'Tag translations retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Upsert tag translation' })
  @ApiResponse({ status: 201, description: 'Translation created' })
  @ApiResponse({ status: 200, description: 'Translation updated' })
  @Post(':tagId/translations')
  async upsertTagTranslation(
    @Param() param: TagParamDto,
    @Body() upsertDto: UpsertTagTranslationDto,
  ) {
    const data = await this.upsertTagTranslationCommand.execute(
      param.tagId,
      upsertDto,
    );
    return this.responseService.success({
      data,
      message: 'Tag translation saved successfully',
    });
  }

  @ApiOperation({ summary: 'Delete tag translation' })
  @ApiResponse({ status: 200, description: 'Translation deleted' })
  @Delete(':tagId/translations/:locale')
  async removeTagTranslation(@Param() param: TagTranslationParamDto) {
    await this.deleteTagTranslationCommand.execute(param.tagId, param.locale);
    return this.responseService.success({
      data: null,
      message: 'Tag translation deleted successfully',
    });
  }
}
