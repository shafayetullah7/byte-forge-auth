import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifiedUserAuthGuard } from '@/libs/guards/verified-user-auth-guard/verified-user-auth.guard';
import { SellerShopGuard } from '@/libs/guards/seller-shop-guard/seller-shop.guard';
import { AuthenticShop } from '@/libs/decorators/authentic-shop.decorator';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@/libs/decorators/api-error.decorator';
import { TAuthorizedShop } from '@/libs/types';
import { ResponseService } from '@/libs/modules/response/response.service';
import { RedeemSubscriptionCouponCommand } from '../application/commands/redeem-subscription-coupon.command';
import { GetSellerSubscriptionQuery } from '../application/queries/get-seller-subscription.query';
import { RedeemSubscriptionCouponDto } from './dto/redeem-subscription-coupon.dto';

@ApiTags('💳 Seller - Subscription')
@Controller({ path: 'user/seller/subscription', version: '1' })
export class SellerSubscriptionController {
  constructor(
    private readonly getSellerSubscriptionQuery: GetSellerSubscriptionQuery,
    private readonly redeemSubscriptionCouponCommand: RedeemSubscriptionCouponCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'Get seller subscription status and available plans' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved' })
  @Get()
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async getSubscription(@AuthenticShop() shop: TAuthorizedShop) {
    const data = await this.getSellerSubscriptionQuery.execute(shop.id);
    return this.responseService.success({
      data,
      message: 'Subscription status retrieved successfully',
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Redeem a seller subscription coupon' })
  @ApiResponse({ status: 200, description: 'Coupon redeemed successfully' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Subscription coupon')
  @ApiConflictResponse('Subscription already active or coupon exhausted')
  @Post('coupon/redeem')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async redeemCoupon(
    @AuthenticShop() shop: TAuthorizedShop,
    @Body() dto: RedeemSubscriptionCouponDto,
  ) {
    const data = await this.redeemSubscriptionCouponCommand.execute(
      shop.id,
      dto,
    );
    return this.responseService.success({
      data,
      message: 'Subscription coupon redeemed successfully',
    });
  }
}
