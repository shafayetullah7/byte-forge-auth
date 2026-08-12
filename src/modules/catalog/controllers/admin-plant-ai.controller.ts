import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { ResponseService } from '@/libs/modules/response/response.service';
import { GetPlantAiUsageStatsQuery } from '../application/plant-ai/get-plant-ai-usage-stats.query';
import { PlantAiUsageStatsQueryDto } from './dto/plant-ai-usage-stats-query.dto';

@ApiTags('🌱 Admin Plant AI')
@Controller({ path: 'admin/plant-ai', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminPlantAiController {
  constructor(
    private readonly getPlantAiUsageStatsQuery: GetPlantAiUsageStatsQuery,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({
    summary: 'Daily Plant AI usage aggregate (UTC)',
    description:
      'Request/success/error counts across all shops for ops monitoring.',
  })
  @Get('usage')
  async getUsageStats(@Query() query: PlantAiUsageStatsQueryDto) {
    const data = await this.getPlantAiUsageStatsQuery.execute(query.usageDate);

    return this.responseService.success({
      message: 'Plant AI usage stats retrieved',
      data,
    });
  }
}
