import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import { ApiNotFoundResponse } from '@/common/decorators/api-error.decorator';
import { ResponseService } from '@/common/modules/response/response.service';
import {
  GetPublicShopCampaignHighlightsQuery,
  GetPublicShopCampaignQuery,
  ListPublicShopCampaignsQuery,
} from '../application/queries';
import { PublicShopCampaignSlugDto, PublicShopSlugDto } from './dto';

@ApiTags('🏪 Public - Shops')
@Controller({ path: 'shops', version: '1' })
export class PublicShopCampaignsController {
  constructor(
    private readonly listPublicShopCampaignsQuery: ListPublicShopCampaignsQuery,
    private readonly getPublicShopCampaignHighlightsQuery: GetPublicShopCampaignHighlightsQuery,
    private readonly getPublicShopCampaignQuery: GetPublicShopCampaignQuery,
    private readonly responseService: ResponseService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'Get shop campaign highlights' })
  @ApiNotFoundResponse('Shop')
  @Get(':slug/campaigns/highlights')
  async getCampaignHighlights(@Param() params: PublicShopSlugDto) {
    const data = await this.getPublicShopCampaignHighlightsQuery.execute(
      params.slug,
    );
    return this.responseService.success({
      message: 'Campaign highlights retrieved successfully',
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get shop campaign detail' })
  @ApiNotFoundResponse('Shop')
  @Get(':slug/campaigns/:campaignSlug')
  async getCampaignDetail(
    @Param() params: PublicShopCampaignSlugDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getPublicShopCampaignQuery.execute(
      params.slug,
      params.campaignSlug,
      lang,
    );
    return this.responseService.success({
      message: 'Campaign retrieved successfully',
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'List shop campaigns' })
  @ApiNotFoundResponse('Shop')
  @Get(':slug/campaigns')
  async listCampaigns(
    @Param() params: PublicShopSlugDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.listPublicShopCampaignsQuery.execute(
      params.slug,
      lang,
    );
    return this.responseService.success({
      message: 'Campaigns retrieved successfully',
      data,
    });
  }
}
