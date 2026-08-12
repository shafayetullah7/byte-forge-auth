import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { VerifiedUserAuthGuard } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard';
import { SellerShopGuard } from '@/common/guards/seller-shop-guard/seller-shop.guard';
import { AuthenticShop } from '@/common/decorators/authentic-shop.decorator';
import { TAuthorizedShop } from '@/common/types';
import { ResponseService } from '@/common/modules/response/response.service';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import { ApiUnauthorizedResponse } from '@/common/decorators/api-error.decorator';
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
