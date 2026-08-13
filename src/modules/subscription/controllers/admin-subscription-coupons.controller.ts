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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@/libs/decorators/api-error.decorator';
import { ResponseService } from '@/libs/modules/response/response.service';
import {
  CreateSubscriptionCouponCommand,
  DeactivateSubscriptionCouponCommand,
  UpdateSubscriptionCouponCommand,
} from '../application/commands';
import {
  GetSubscriptionCouponQuery,
  ListSubscriptionCouponsQuery,
} from '../application/queries';
import { CreateSubscriptionCouponDto } from './dto/create-subscription-coupon.dto';
import {
  ListSubscriptionCouponsQueryDto,
  SubscriptionCouponIdParamDto,
} from './dto/list-subscription-coupons-query.dto';
import { UpdateSubscriptionCouponDto } from './dto/update-subscription-coupon.dto';

@ApiTags('🎟️ Admin - Subscription Coupons')
@UseGuards(AdminAuthGuard)
@ApiAuth()
@Controller({ path: 'admin/subscription/coupons', version: '1' })
export class AdminSubscriptionCouponsController {
  constructor(
    private readonly listSubscriptionCouponsQuery: ListSubscriptionCouponsQuery,
    private readonly getSubscriptionCouponQuery: GetSubscriptionCouponQuery,
    private readonly createSubscriptionCouponCommand: CreateSubscriptionCouponCommand,
    private readonly updateSubscriptionCouponCommand: UpdateSubscriptionCouponCommand,
    private readonly deactivateSubscriptionCouponCommand: DeactivateSubscriptionCouponCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'List seller subscription coupons' })
  @ApiResponse({ status: 200, description: 'Subscription coupons retrieved' })
  @Get()
  async findAll(@Query() query: ListSubscriptionCouponsQueryDto) {
    const data = await this.listSubscriptionCouponsQuery.execute(query);
    return this.responseService.success({
      data,
      message: 'Subscription coupons retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Get subscription coupon by ID' })
  @ApiResponse({ status: 200, description: 'Subscription coupon retrieved' })
  @ApiNotFoundResponse('Subscription coupon')
  @Get(':id')
  async findOne(@Param() param: SubscriptionCouponIdParamDto) {
    const data = await this.getSubscriptionCouponQuery.execute(param.id);
    return this.responseService.success({
      data,
      message: 'Subscription coupon retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Create a seller subscription coupon' })
  @ApiResponse({ status: 201, description: 'Subscription coupon created' })
  @ApiBadRequestResponse()
  @Post()
  async create(@Body() dto: CreateSubscriptionCouponDto) {
    const data = await this.createSubscriptionCouponCommand.execute(dto);
    return this.responseService.success({
      data,
      message: 'Subscription coupon created successfully',
    });
  }

  @ApiOperation({ summary: 'Update a seller subscription coupon' })
  @ApiResponse({ status: 200, description: 'Subscription coupon updated' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Subscription coupon')
  @Patch(':id')
  async update(
    @Param() param: SubscriptionCouponIdParamDto,
    @Body() dto: UpdateSubscriptionCouponDto,
  ) {
    const data = await this.updateSubscriptionCouponCommand.execute(
      param.id,
      dto,
    );
    return this.responseService.success({
      data,
      message: 'Subscription coupon updated successfully',
    });
  }

  @ApiOperation({ summary: 'Deactivate a seller subscription coupon' })
  @ApiResponse({ status: 200, description: 'Subscription coupon deactivated' })
  @ApiNotFoundResponse('Subscription coupon')
  @Patch(':id/deactivate')
  async deactivate(@Param() param: SubscriptionCouponIdParamDto) {
    const data = await this.deactivateSubscriptionCouponCommand.execute(
      param.id,
    );
    return this.responseService.success({
      data,
      message: 'Subscription coupon deactivated successfully',
    });
  }
}
