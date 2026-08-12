import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { ResponseService } from '@/libs/modules/response/response.service';
import {
  GetAdminOrderQuery,
  GetAdminOrderStatsQuery,
  ListAdminOrdersQuery,
} from '../application/queries';
import {
  AdminOrderIdParamDto,
  AdminOrderStatsQueryDto,
  AdminOrdersQueryDto,
} from './dto/admin-orders-query.dto';

@ApiTags('📦 Admin Orders')
@Controller({ path: 'admin/orders', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminOrdersController {
  constructor(
    private readonly listAdminOrdersQuery: ListAdminOrdersQuery,
    private readonly getAdminOrderStatsQuery: GetAdminOrderStatsQuery,
    private readonly getAdminOrderQuery: GetAdminOrderQuery,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'List orders across all shops' })
  @Get()
  async listOrders(
    @Query() query: AdminOrdersQueryDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.listAdminOrdersQuery.execute(
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        shopId: query.shopId,
        userId: query.userId,
        orderStatus: query.status,
        paymentStatus: query.paymentStatus,
        search: query.search,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      },
      lang,
    );

    return this.responseService.paginated({
      message: 'Orders retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiOperation({ summary: 'Get order counts by status' })
  @Get('stats')
  async getOrderStats(@Query() query: AdminOrderStatsQueryDto) {
    const data = await this.getAdminOrderStatsQuery.execute({
      shopId: query.shopId,
      userId: query.userId,
    });

    return this.responseService.success({
      message: 'Order stats retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Get order detail' })
  @Get(':orderId')
  async getOrder(
    @Param() params: AdminOrderIdParamDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getAdminOrderQuery.execute(params.orderId, lang);

    return this.responseService.success({
      message: 'Order retrieved successfully',
      data,
    });
  }
}
