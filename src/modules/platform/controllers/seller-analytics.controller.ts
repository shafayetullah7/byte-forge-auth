import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { VerifiedUserAuthGuard } from '@/libs/guards/verified-user-auth-guard/verified-user-auth.guard';
import { SellerShopGuard } from '@/libs/guards/seller-shop-guard/seller-shop.guard';
import { AuthenticShop } from '@/libs/decorators/authentic-shop.decorator';
import { TAuthorizedShop } from '@/libs/types';
import { ResponseService } from '@/libs/modules/response/response.service';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import { ApiUnauthorizedResponse } from '@/libs/decorators/api-error.decorator';
import { GetSellerAnalyticsOverviewQuery } from '../application/queries';

@ApiTags('📊 Seller - Analytics')
@Controller({ path: 'user/seller/analytics', version: '1' })
export class SellerAnalyticsController {
  constructor(
    private readonly getSellerAnalyticsOverviewQuery: GetSellerAnalyticsOverviewQuery,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'Get seller shop analytics overview' })
  @ApiUnauthorizedResponse()
  @Get('overview')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async getOverview(
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ) {
    const data = await this.getSellerAnalyticsOverviewQuery.execute(
      shop.id,
      lang,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.analyticsOverviewRetrieved', {
        lang,
        defaultValue: 'Analytics overview retrieved successfully',
      }),
      data,
    });
  }
}
