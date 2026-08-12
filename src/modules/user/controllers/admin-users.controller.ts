import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { AdminAuthGuard } from '@/common/guards/admin-auth-guard/admin-auth.guard';
import { ResponseService } from '@/common/modules/response/response.service';
import { ListAdminOrdersQuery } from '@/modules/order/application/queries';
import { GetAdminUserQuery, ListAdminUsersQuery } from '../application/queries';
import {
  AdminUserIdParamDto,
  AdminUsersQueryDto,
} from './dto/admin-users-query.dto';

@ApiTags('👤 Admin Users')
@Controller({ path: 'admin/users', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminUsersController {
  constructor(
    private readonly listAdminUsersQuery: ListAdminUsersQuery,
    private readonly getAdminUserQuery: GetAdminUserQuery,
    private readonly listAdminOrdersQuery: ListAdminOrdersQuery,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'Search marketplace users (buyers)' })
  @Get()
  async listUsers(@Query() query: AdminUsersQueryDto) {
    const result = await this.listAdminUsersQuery.execute(query);
    return this.responseService.paginated({
      message: 'Users retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiOperation({ summary: 'Get user profile for support' })
  @Get(':userId')
  async getUser(@Param() params: AdminUserIdParamDto) {
    const data = await this.getAdminUserQuery.execute(params.userId);
    return this.responseService.success({
      message: 'User retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Get recent orders for a user' })
  @Get(':userId/orders')
  async getUserOrders(
    @Param() params: AdminUserIdParamDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.listAdminOrdersQuery.execute(
      {
        userId: params.userId,
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      lang,
    );
    return this.responseService.paginated({
      message: 'User orders retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }
}
