import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { ResponseService } from '@/libs/modules/response/response.service';
import { AuthenticAdminUser } from '@/libs/decorators/authentic-admin.decorator';
import { AuthenticAdmin } from '@/libs/types';
import {
  ApproveArticleCommand,
  RejectArticleCommand,
  SetArticleEditorsPickCommand,
} from '../application/commands';
import {
  GetAdminArticleQuery,
  ListAdminArticlesQuery,
} from '../application/queries';
import {
  AdminArticlesQueryDto,
  ArticleIdParamDto,
  EditorsPickDto,
  RejectArticleDto,
} from './dto';

@ApiTags('📰 Admin Articles')
@Controller({ path: 'admin/articles', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminArticlesController {
  constructor(
    private readonly listAdminArticlesQuery: ListAdminArticlesQuery,
    private readonly getAdminArticleQuery: GetAdminArticleQuery,
    private readonly approveArticleCommand: ApproveArticleCommand,
    private readonly rejectArticleCommand: RejectArticleCommand,
    private readonly setArticleEditorsPickCommand: SetArticleEditorsPickCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'List articles for moderation' })
  @Get()
  async listArticles(@Query() query: AdminArticlesQueryDto) {
    const result = await this.listAdminArticlesQuery.execute(query);
    return this.responseService.paginated({
      message: 'Articles retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiOperation({ summary: 'Get article details' })
  @Get(':id')
  async getArticle(@Param() params: ArticleIdParamDto) {
    const data = await this.getAdminArticleQuery.execute(params.id);
    return this.responseService.success({
      message: 'Article retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Approve a pending article' })
  @Post(':id/approve')
  async approveArticle(
    @Param() params: ArticleIdParamDto,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    const data = await this.approveArticleCommand.execute(
      params.id,
      admin.admin.id,
    );
    return this.responseService.success({
      message: 'Article approved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Reject a pending article' })
  @Post(':id/reject')
  async rejectArticle(
    @Param() params: ArticleIdParamDto,
    @Body() dto: RejectArticleDto,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    const data = await this.rejectArticleCommand.execute(
      params.id,
      admin.admin.id,
      dto,
    );
    return this.responseService.success({
      message: 'Article rejected successfully',
      data,
    });
  }

  @ApiOperation({ summary: "Set or clear an article as editor's pick" })
  @Patch(':id/editors-pick')
  async setEditorsPick(
    @Param() params: ArticleIdParamDto,
    @Body() dto: EditorsPickDto,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    const data = await this.setArticleEditorsPickCommand.execute(
      params.id,
      admin.admin.id,
      dto.isEditorsPick,
    );
    return this.responseService.success({
      message: dto.isEditorsPick
        ? "Article marked as editor's pick"
        : "Article removed from editor's pick",
      data,
    });
  }
}
