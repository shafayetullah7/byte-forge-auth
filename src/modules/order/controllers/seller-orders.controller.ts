import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VerifiedUserAuthGuard } from '@/libs/guards/verified-user-auth-guard/verified-user-auth.guard';
import { SellerShopGuard } from '@/libs/guards/seller-shop-guard/seller-shop.guard';
import { AuthenticShop } from '@/libs/decorators/authentic-shop.decorator';
import { AuthenticUser } from '@/libs/decorators/authentic-user.decorator';
import { TAuthorizedShop, TAuthenticUser } from '@/libs/types';
import { ResponseService } from '@/libs/modules/response/response.service';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@/libs/decorators/api-error.decorator';
import {
  CancelSellerOrderCommand,
  ShipSellerOrderCommand,
  UpdateSellerOrderStatusCommand,
} from '../application/commands';
import {
  GetSellerOrderQuery,
  GetSellerOrderStatsQuery,
  ListSellerOrdersQuery,
} from '../application/queries';
import { CancelSellerOrderDto } from './dto/cancel-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import {
  OrderIdParamDto,
  SellerOrdersFilterDto,
} from './dto/seller-orders-filter.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('📦 Seller - Orders')
@Controller({ path: 'user/seller/orders', version: '1' })
export class SellerOrdersController {
  constructor(
    private readonly listSellerOrdersQuery: ListSellerOrdersQuery,
    private readonly getSellerOrderStatsQuery: GetSellerOrderStatsQuery,
    private readonly getSellerOrderQuery: GetSellerOrderQuery,
    private readonly updateSellerOrderStatusCommand: UpdateSellerOrderStatusCommand,
    private readonly shipSellerOrderCommand: ShipSellerOrderCommand,
    private readonly cancelSellerOrderCommand: CancelSellerOrderCommand,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'List shop orders' })
  @ApiUnauthorizedResponse()
  @Get()
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async getOrders(
    @AuthenticShop() shop: TAuthorizedShop,
    @Query() query: SellerOrdersFilterDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.listSellerOrdersQuery.execute(
      shop.id,
      query,
      lang,
    );

    return this.responseService.paginated({
      message: this.i18n.t('message.success.ordersRetrieved', { lang }),
      data: result.orders,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total: result.total,
      },
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get shop order statistics' })
  @ApiUnauthorizedResponse()
  @Get('stats')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async getStats(
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ) {
    const stats = await this.getSellerOrderStatsQuery.execute(shop.id);

    return this.responseService.success({
      message: this.i18n.t('message.success.orderStatsRetrieved', { lang }),
      data: stats,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get order detail' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @Get(':orderId')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async getOrder(
    @AuthenticShop() shop: TAuthorizedShop,
    @Param() params: OrderIdParamDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getSellerOrderQuery.execute(
      shop,
      params.orderId,
      lang,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.orderGroupRetrieved', { lang }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Update order status' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Patch(':orderId/status')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async updateStatus(
    @AuthenticShop() shop: TAuthorizedShop,
    @AuthenticUser() authUser: TAuthenticUser,
    @Param() params: OrderIdParamDto,
    @Body() body: UpdateOrderStatusDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.updateSellerOrderStatusCommand.execute(
      shop,
      params.orderId,
      authUser.user.id,
      {
        status: body.status,
        notes: body.notes,
        expectedUpdatedAt: body.expectedUpdatedAt,
      },
      lang,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.orderUpdated', { lang }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Ship order with tracking' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Post(':orderId/ship')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async shipOrder(
    @AuthenticShop() shop: TAuthorizedShop,
    @AuthenticUser() authUser: TAuthenticUser,
    @Param() params: OrderIdParamDto,
    @Body() body: ShipOrderDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.shipSellerOrderCommand.execute(
      shop,
      params.orderId,
      authUser.user.id,
      {
        carrier: body.carrier,
        trackingNumber: body.trackingNumber,
        shippingMethod: body.shippingMethod,
        estimatedDelivery: body.estimatedDelivery,
        notes: body.notes,
        expectedUpdatedAt: body.expectedUpdatedAt,
      },
      lang,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.orderShipped', { lang }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Cancel order' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Patch(':orderId/cancel')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async cancelOrder(
    @AuthenticShop() shop: TAuthorizedShop,
    @AuthenticUser() authUser: TAuthenticUser,
    @Param() params: OrderIdParamDto,
    @Body() body: CancelSellerOrderDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.cancelSellerOrderCommand.execute(
      shop,
      params.orderId,
      authUser.user.id,
      {
        reason: body.reason,
        expectedUpdatedAt: body.expectedUpdatedAt,
      },
      lang,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.orderCancelled', { lang }),
      data,
    });
  }
}
