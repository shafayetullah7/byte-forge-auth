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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { VerifiedUserAuthGuard } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard';
import { SellerShopGuard } from '@/common/guards/seller-shop-guard/seller-shop.guard';
import { AuthenticShop } from '@/common/decorators/authentic-shop.decorator';
import { TAuthorizedShop } from '@/common/types';
import { ResponseService } from '@/common/modules/response/response.service';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import {
  ArchiveCampaignCommand,
  CreateCampaignCommand,
  DeleteCampaignCommand,
  SubmitCampaignCommand,
  UpdateCampaignCommand,
} from '../application/commands';
import {
  GetSellerCampaignQuery,
  ListSellerCampaignsQuery,
} from '../application/queries';
import {
  CampaignIdParamDto,
  CreateCampaignDto,
  ListCampaignsQueryDto,
  UpdateCampaignDto,
} from './dto';

@ApiTags('📣 Seller - Campaigns')
@Controller({ path: 'user/seller/campaigns', version: '1' })
export class SellerCampaignsController {
  constructor(
    private readonly listSellerCampaignsQuery: ListSellerCampaignsQuery,
    private readonly getSellerCampaignQuery: GetSellerCampaignQuery,
    private readonly createCampaignCommand: CreateCampaignCommand,
    private readonly updateCampaignCommand: UpdateCampaignCommand,
    private readonly submitCampaignCommand: SubmitCampaignCommand,
    private readonly archiveCampaignCommand: ArchiveCampaignCommand,
    private readonly deleteCampaignCommand: DeleteCampaignCommand,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'List seller campaigns' })
  @Get()
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async list(
    @AuthenticShop() shop: TAuthorizedShop,
    @Query() query: ListCampaignsQueryDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.listSellerCampaignsQuery.execute(shop.id, query);
    return this.responseService.paginated({
      message: this.i18n.t('message.success.campaignsRetrieved', {
        lang,
        defaultValue: 'Campaigns retrieved successfully',
      }),
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get campaign detail' })
  @Get(':id')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async get(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: CampaignIdParamDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getSellerCampaignQuery.execute(shop.id, params.id);
    return this.responseService.success({
      message: this.i18n.t('message.success.campaignRetrieved', {
        lang,
        defaultValue: 'Campaign retrieved successfully',
      }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Create campaign draft' })
  @Post()
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async create(
    @AuthenticShop() shop: TAuthorizedShop,
    @Body() dto: CreateCampaignDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.createCampaignCommand.execute(shop.id, dto);
    return this.responseService.success({
      message: this.i18n.t('message.success.campaignCreated', {
        lang,
        defaultValue: 'Campaign created successfully',
      }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Update campaign' })
  @Patch(':id')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async update(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: CampaignIdParamDto,
    @Body() dto: UpdateCampaignDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.updateCampaignCommand.execute(
      shop.id,
      params.id,
      dto,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.campaignUpdated', {
        lang,
        defaultValue: 'Campaign updated successfully',
      }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Submit campaign for review' })
  @Post(':id/submit')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async submit(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: CampaignIdParamDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.submitCampaignCommand.execute(
      shop.id,
      params.id,
      shop.status,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.campaignSubmitted', {
        lang,
        defaultValue: 'Campaign submitted for review',
      }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Archive campaign' })
  @Post(':id/archive')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async archive(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: CampaignIdParamDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.archiveCampaignCommand.execute(shop.id, params.id);
    return this.responseService.success({
      message: this.i18n.t('message.success.campaignArchived', {
        lang,
        defaultValue: 'Campaign archived successfully',
      }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Delete campaign' })
  @Delete(':id')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async delete(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: CampaignIdParamDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.deleteCampaignCommand.execute(shop.id, params.id);
    return this.responseService.success({
      message: this.i18n.t('message.success.campaignDeleted', {
        lang,
        defaultValue: 'Campaign deleted successfully',
      }),
      data,
    });
  }
}
