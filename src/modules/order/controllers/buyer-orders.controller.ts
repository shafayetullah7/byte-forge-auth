import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseService } from '@/common/modules/response/response.service';
import { I18nLang, I18nService } from 'nestjs-i18n';
import {
  ApiAuth,
  ApiOkResponseTyped,
} from '@/common/decorators/swagger.decorators';
import {
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@/common/decorators/api-error.decorator';
import { AuthenticUser } from '@/common/decorators/authentic-user.decorator';
import { TAuthenticUser } from '@/common/types';
import { UserAuthGuard } from '@/common/guards/user-auth-guard/user-auth.guard';
import {
  CancelBuyerOrderCommand,
  ConfirmDeliveryCommand,
} from '../application/commands';
import {
  GetBuyerOrdersQuery,
  GetBuyerOrderStatsQuery,
  GetOrderGroupQuery,
} from '../application/queries';
import { OrdersFilterDto } from './dto/orders-pagination.dto';
import {
  GetOrdersResponseDto,
  OrderStatsResponseDto,
  GetOrderGroupResponseDto,
} from './dto/orders-response.dto';

@ApiTags('📦 Buyer Orders')
@Controller({ path: 'user/buyer/orders', version: '1' })
@UseGuards(UserAuthGuard)
export class BuyerOrdersController {
  constructor(
    private readonly getBuyerOrdersQuery: GetBuyerOrdersQuery,
    private readonly getBuyerOrderStatsQuery: GetBuyerOrderStatsQuery,
    private readonly getOrderGroupQuery: GetOrderGroupQuery,
    private readonly cancelBuyerOrderCommand: CancelBuyerOrderCommand,
    private readonly confirmDeliveryCommand: ConfirmDeliveryCommand,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'Get buyer orders',
    description:
      'Returns all orders grouped by order group for the authenticated buyer with pagination and filtering.',
  })
  @ApiOkResponseTyped(GetOrdersResponseDto, 'Orders retrieved successfully')
  @ApiUnauthorizedResponse()
  @Get()
  async getOrders(
    @AuthenticUser() authUser: TAuthenticUser,
    @Query() query: OrdersFilterDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.getBuyerOrdersQuery.execute(
      authUser.user.id,
      query,
      lang,
    );

    return this.responseService.paginated({
      message: this.i18n.t('message.success.ordersRetrieved', { lang }),
      data: result.groups,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total: result.total,
      },
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get order statistics',
    description:
      'Returns aggregated order statistics (total, active, delivered, cancelled, total spent) for the authenticated buyer.',
  })
  @ApiOkResponseTyped(
    OrderStatsResponseDto,
    'Order statistics retrieved successfully',
  )
  @ApiUnauthorizedResponse()
  @Get('stats')
  async getOrderStats(
    @AuthenticUser() authUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const stats = await this.getBuyerOrderStatsQuery.execute(authUser.user.id);

    return this.responseService.success({
      message: this.i18n.t('message.success.orderStatsRetrieved', { lang }),
      data: stats,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get order group detail',
    description:
      'Returns full details for a specific order group including all orders, items, addresses, payment info, and status history. Translations are resolved based on the locale parameter.',
  })
  @ApiOkResponseTyped(
    GetOrderGroupResponseDto,
    'Order group details retrieved successfully',
  )
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @Get(':groupId')
  async getOrderGroup(
    @AuthenticUser() authUser: TAuthenticUser,
    @Param('groupId') groupId: string,
    @I18nLang() lang: string,
  ) {
    const data = await this.getOrderGroupQuery.execute(
      authUser.user.id,
      groupId,
      lang,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.orderGroupRetrieved', { lang }),
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Cancel an order',
    description:
      'Cancels an order if it is in a cancellable status (PENDING_PAYMENT or PROCESSING). Records the cancellation in status history.',
  })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse('Order cannot be cancelled in current status')
  @Post(':orderId/cancel')
  async cancelOrder(
    @AuthenticUser() authUser: TAuthenticUser,
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
    @I18nLang() lang: string,
  ) {
    await this.cancelBuyerOrderCommand.execute(
      authUser.user.id,
      orderId,
      body.reason,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.orderCancelled', { lang }),
      data: null,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Confirm order delivery',
    description:
      'Buyer confirms receipt of a shipped order. Transitions order to DELIVERED.',
  })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse('Order is not in SHIPPED status')
  @Post(':orderId/confirm-delivery')
  async confirmDelivery(
    @AuthenticUser() authUser: TAuthenticUser,
    @Param('orderId') orderId: string,
    @I18nLang() lang: string,
  ) {
    await this.confirmDeliveryCommand.execute(authUser.user.id, orderId);

    return this.responseService.success({
      message: this.i18n.t('message.success.orderDelivered', { lang }),
      data: { orderId, status: 'DELIVERED' },
    });
  }
}
