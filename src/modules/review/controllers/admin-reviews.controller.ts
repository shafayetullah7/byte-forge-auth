import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { AuthenticAdminUser } from '@/libs/decorators/authentic-admin.decorator';
import { AuthenticAdmin } from '@/libs/types';
import { ResponseService } from '@/libs/modules/response/response.service';
import {
  FeatureReviewCommand,
  RemoveReviewCommand,
  RestoreReviewCommand,
  UnfeatureReviewCommand,
  UpdateReviewReportStatusCommand,
} from '../application/commands';
import {
  GetAdminReviewQuery,
  ListAdminReviewsQuery,
} from '../application/queries';
import {
  AdminReviewQueryDto,
  RemoveReviewDto,
  ReviewIdParamDto,
  ReviewReportIdParamDto,
  UpdateReviewReportStatusDto,
} from './dto';

@ApiTags('⭐ Admin Reviews')
@Controller({ path: 'admin/reviews', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminReviewsController {
  constructor(
    private readonly listAdminReviewsQuery: ListAdminReviewsQuery,
    private readonly getAdminReviewQuery: GetAdminReviewQuery,
    private readonly featureReviewCommand: FeatureReviewCommand,
    private readonly unfeatureReviewCommand: UnfeatureReviewCommand,
    private readonly removeReviewCommand: RemoveReviewCommand,
    private readonly restoreReviewCommand: RestoreReviewCommand,
    private readonly updateReviewReportStatusCommand: UpdateReviewReportStatusCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'List reviews for moderation' })
  @Get()
  async listReviews(
    @Query() query: AdminReviewQueryDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.listAdminReviewsQuery.execute(query, lang);
    return this.responseService.paginated({
      message: 'Reviews retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiOperation({ summary: 'Update review report status' })
  @Patch('reports/:reportId/status')
  async updateReportStatus(
    @Param() params: ReviewReportIdParamDto,
    @Body() body: UpdateReviewReportStatusDto,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    const data = await this.updateReviewReportStatusCommand.execute(
      params.reportId,
      body.status,
      admin.admin.id,
    );
    return this.responseService.success({
      message: 'Review report status updated successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Get review details' })
  @Get(':reviewId')
  async getReview(@Param() params: ReviewIdParamDto, @I18nLang() lang: string) {
    const data = await this.getAdminReviewQuery.execute(params.reviewId, lang);
    return this.responseService.success({
      message: 'Review retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Feature a review for landing pages' })
  @Patch(':reviewId/feature')
  async featureReview(
    @Param() params: ReviewIdParamDto,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    const data = await this.featureReviewCommand.execute(
      params.reviewId,
      admin.admin.id,
    );
    return this.responseService.success({
      message: 'Review featured successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Unfeature a review' })
  @Patch(':reviewId/unfeature')
  async unfeatureReview(@Param() params: ReviewIdParamDto) {
    const data = await this.unfeatureReviewCommand.execute(params.reviewId);
    return this.responseService.success({
      message: 'Review unfeatured successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Remove a review from public visibility' })
  @Patch(':reviewId/remove')
  async removeReview(
    @Param() params: ReviewIdParamDto,
    @Body() body: RemoveReviewDto,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    const data = await this.removeReviewCommand.execute(
      params.reviewId,
      admin.admin.id,
      body.reason,
    );
    return this.responseService.success({
      message: 'Review removed successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Restore a previously removed review' })
  @Patch(':reviewId/restore')
  async restoreReview(@Param() params: ReviewIdParamDto) {
    const data = await this.restoreReviewCommand.execute(params.reviewId);
    return this.responseService.success({
      message: 'Review restored successfully',
      data,
    });
  }
}
