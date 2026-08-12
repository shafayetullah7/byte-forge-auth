import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { VerifiedUserAuthGuard } from '@/libs/guards/verified-user-auth-guard/verified-user-auth.guard';
import { SellerShopGuard } from '@/libs/guards/seller-shop-guard/seller-shop.guard';
import { AuthenticShop } from '@/libs/decorators/authentic-shop.decorator';
import { TAuthorizedShop } from '@/libs/types';
import { ResponseService } from '@/libs/modules/response/response.service';
import { SuccessResponse } from '@/libs/modules/response/dto/success.response.dto';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@/libs/decorators/api-error.decorator';
import {
  BulkUpdateShippingRatesCommand,
  type ShippingRate,
} from '../application/commands';
import {
  GetShippingRatesQuery,
  type ShippingRateResponse,
} from '../application/queries';
import { BulkUpdateShippingRatesDto } from './dto/update-shipping-rates.dto';

@ApiTags('🚚 Seller - Shipping Rates')
@Controller({ path: 'user/seller/shipping-rates', version: '1' })
export class SellerShippingRatesController {
  constructor(
    private readonly getShippingRatesQuery: GetShippingRatesQuery,
    private readonly bulkUpdateShippingRatesCommand: BulkUpdateShippingRatesCommand,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'Get shipping rates per district',
    description:
      "Returns all district shipping rates configured for the seller's shop. Districts without a rate default to 0.",
  })
  @ApiResponse({ status: 200, description: 'Shipping rates retrieved' })
  @ApiUnauthorizedResponse()
  @Get('my-shop')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async getShippingRates(
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<ShippingRateResponse[]>> {
    const rates = await this.getShippingRatesQuery.execute(shop.id, lang);
    return this.responseService.success({
      message: this.i18n.t('message.success.shippingRatesRetrieved', { lang }),
      data: rates,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Bulk update shipping rates',
    description:
      'Upserts shipping rates for multiple districts at once. Only the districts provided in the request are updated; existing rates for other districts remain unchanged.',
  })
  @ApiResponse({ status: 200, description: 'Shipping rates updated' })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @Put('my-shop')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async bulkUpdateShippingRates(
    @Body() dto: BulkUpdateShippingRatesDto,
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<ShippingRate[]>> {
    const rates = await this.bulkUpdateShippingRatesCommand.execute(
      shop.id,
      dto.rates,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.shippingRatesUpdated', { lang }),
      data: rates,
    });
  }
}
