import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '@/common/guards/admin-auth-guard/admin-auth.guard';
import { ResponseService } from '@/common/modules/response/response.service';
import { AuthenticAdminUser } from '@/common/decorators/authentic-admin.decorator';
import { AuthenticAdmin } from '@/common/types';
import {
  ApproveCampaignCommand,
  RejectCampaignCommand,
} from '../application/commands';
import {
  GetAdminCampaignQuery,
  ListAdminCampaignsQuery,
} from '../application/queries';
import {
  AdminCampaignsQueryDto,
  CampaignIdParamDto,
  RejectCampaignDto,
} from './dto';

@ApiTags('📣 Admin Campaigns')
@Controller({ path: 'admin/campaigns', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminCampaignsController {
  constructor(
    private readonly listAdminCampaignsQuery: ListAdminCampaignsQuery,
    private readonly getAdminCampaignQuery: GetAdminCampaignQuery,
    private readonly approveCampaignCommand: ApproveCampaignCommand,
    private readonly rejectCampaignCommand: RejectCampaignCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'List campaigns for moderation' })
  @Get()
  async listCampaigns(@Query() query: AdminCampaignsQueryDto) {
    const result = await this.listAdminCampaignsQuery.execute(query);
    return this.responseService.paginated({
      message: 'Campaigns retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiOperation({ summary: 'Get campaign details' })
  @Get(':id')
  async getCampaign(@Param() params: CampaignIdParamDto) {
    const data = await this.getAdminCampaignQuery.execute(params.id);
    return this.responseService.success({
      message: 'Campaign retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Approve a pending campaign' })
  @Post(':id/approve')
  async approveCampaign(
    @Param() params: CampaignIdParamDto,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    const data = await this.approveCampaignCommand.execute(
      params.id,
      admin.admin.id,
    );
    return this.responseService.success({
      message: 'Campaign approved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Reject a pending campaign' })
  @Post(':id/reject')
  async rejectCampaign(
    @Param() params: CampaignIdParamDto,
    @Body() dto: RejectCampaignDto,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    const data = await this.rejectCampaignCommand.execute(
      params.id,
      admin.admin.id,
      dto,
    );
    return this.responseService.success({
      message: 'Campaign rejected successfully',
      data,
    });
  }
}
