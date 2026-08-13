import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@/libs/decorators/api-error.decorator';
import { ResponseService } from '@/libs/modules/response/response.service';
import { ExtendShopSubscriptionCommand } from '../application/commands/extend-shop-subscription.command';
import { GetAdminShopSubscriptionQuery } from '../application/queries/get-admin-shop-subscription.query';
import { AdminShopSubscriptionParamDto } from './dto/admin-shop-subscription-param.dto';
import { ExtendShopSubscriptionDto } from './dto/extend-shop-subscription.dto';

@ApiTags('🏪 Admin - Shop Subscription')
@UseGuards(AdminAuthGuard)
@ApiAuth()
@Controller({ path: 'admin/shops/:shopId/subscription', version: '1' })
export class AdminShopSubscriptionController {
  constructor(
    private readonly getAdminShopSubscriptionQuery: GetAdminShopSubscriptionQuery,
    private readonly extendShopSubscriptionCommand: ExtendShopSubscriptionCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'Get shop subscription status and recent invoices' })
  @ApiResponse({ status: 200, description: 'Shop subscription retrieved' })
  @ApiNotFoundResponse('Shop')
  @Get()
  async getSubscription(@Param() param: AdminShopSubscriptionParamDto) {
    const data = await this.getAdminShopSubscriptionQuery.execute(param.shopId);
    return this.responseService.success({
      data,
      message: 'Shop subscription retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Manually extend a shop subscription period' })
  @ApiResponse({ status: 200, description: 'Shop subscription extended' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Shop')
  @Post('extend')
  async extend(
    @Param() param: AdminShopSubscriptionParamDto,
    @Body() dto: ExtendShopSubscriptionDto,
  ) {
    const data = await this.extendShopSubscriptionCommand.execute(
      param.shopId,
      dto,
    );
    return this.responseService.success({
      data,
      message: 'Shop subscription extended successfully',
    });
  }
}
