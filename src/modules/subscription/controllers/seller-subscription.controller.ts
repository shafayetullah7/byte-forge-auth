import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifiedUserAuthGuard } from '@/libs/guards/verified-user-auth-guard/verified-user-auth.guard';
import { SellerShopGuard } from '@/libs/guards/seller-shop-guard/seller-shop.guard';
import { AuthenticShop } from '@/libs/decorators/authentic-shop.decorator';
import { AuthenticUser } from '@/libs/decorators/authentic-user.decorator';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import { ApiPagination } from '@/libs/decorators/api-pagination.decorator';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@/libs/decorators/api-error.decorator';
import { TAuthorizedShop, TAuthenticUser } from '@/libs/types';
import { ResponseService } from '@/libs/modules/response/response.service';
import { CreateSellerSubscriptionCheckoutCommand } from '../application/commands/create-seller-subscription-checkout.command';
import { RedeemSubscriptionCouponCommand } from '../application/commands/redeem-subscription-coupon.command';
import { GetSellerSubscriptionQuery } from '../application/queries/get-seller-subscription.query';
import { ListSellerSubscriptionInvoicesQuery } from '../application/queries/list-seller-subscription-invoices.query';
import { CreateSellerSubscriptionCheckoutDto } from './dto/create-seller-subscription-checkout.dto';
import { ListSellerSubscriptionInvoicesQueryDto } from './dto/list-seller-subscription-invoices-query.dto';
import { RedeemSubscriptionCouponDto } from './dto/redeem-subscription-coupon.dto';

@ApiTags('💳 Seller - Subscription')
@Controller({ path: 'user/seller/subscription', version: '1' })
export class SellerSubscriptionController {
  constructor(
    private readonly getSellerSubscriptionQuery: GetSellerSubscriptionQuery,
    private readonly listSellerSubscriptionInvoicesQuery: ListSellerSubscriptionInvoicesQuery,
    private readonly createSellerSubscriptionCheckoutCommand: CreateSellerSubscriptionCheckoutCommand,
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
  @ApiOperation({ summary: 'List seller subscription invoices' })
  @ApiResponse({ status: 200, description: 'Subscription invoices retrieved' })
  @ApiPagination()
  @Get('invoices')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async listInvoices(
    @AuthenticShop() shop: TAuthorizedShop,
    @Query() query: ListSellerSubscriptionInvoicesQueryDto,
  ) {
    const result = await this.listSellerSubscriptionInvoicesQuery.execute(
      shop.id,
      query,
    );
    return this.responseService.paginated({
      message: 'Subscription invoices retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Create Stripe Checkout session for subscription' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Subscription plan')
  @ApiConflictResponse('Subscription already active or checkout in progress')
  @Post('checkout')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async createCheckout(
    @AuthenticShop() shop: TAuthorizedShop,
    @AuthenticUser() auth: TAuthenticUser,
    @Body() dto: CreateSellerSubscriptionCheckoutDto,
  ) {
    const data = await this.createSellerSubscriptionCheckoutCommand.execute(
      shop.id,
      auth.user.id,
      dto,
    );
    return this.responseService.success({
      data,
      message: 'Stripe checkout session created successfully',
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
