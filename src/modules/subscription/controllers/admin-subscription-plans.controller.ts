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
  CreateSubscriptionPlanCommand,
  RetireSubscriptionPlanCommand,
  SyncPlanToStripeCommand,
  UpdateSubscriptionPlanCommand,
} from '../application/commands';
import {
  GetSubscriptionPlanQuery,
  ListSubscriptionPlansQuery,
} from '../application/queries';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import {
  ListSubscriptionPlansQueryDto,
  SubscriptionPlanIdParamDto,
} from './dto/list-subscription-plans-query.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@ApiTags('💳 Admin - Subscription Plans')
@UseGuards(AdminAuthGuard)
@ApiAuth()
@Controller({ path: 'admin/subscription/plans', version: '1' })
export class AdminSubscriptionPlansController {
  constructor(
    private readonly listSubscriptionPlansQuery: ListSubscriptionPlansQuery,
    private readonly getSubscriptionPlanQuery: GetSubscriptionPlanQuery,
    private readonly createSubscriptionPlanCommand: CreateSubscriptionPlanCommand,
    private readonly updateSubscriptionPlanCommand: UpdateSubscriptionPlanCommand,
    private readonly retireSubscriptionPlanCommand: RetireSubscriptionPlanCommand,
    private readonly syncPlanToStripeCommand: SyncPlanToStripeCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'List seller subscription plans' })
  @ApiResponse({ status: 200, description: 'Subscription plans retrieved' })
  @Get()
  async findAll(@Query() query: ListSubscriptionPlansQueryDto) {
    const data = await this.listSubscriptionPlansQuery.execute(query);
    return this.responseService.success({
      data,
      message: 'Subscription plans retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'Subscription plan retrieved' })
  @ApiNotFoundResponse('Subscription plan')
  @Get(':id')
  async findOne(@Param() param: SubscriptionPlanIdParamDto) {
    const data = await this.getSubscriptionPlanQuery.execute(param.id);
    return this.responseService.success({
      data,
      message: 'Subscription plan retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Create a seller subscription plan' })
  @ApiResponse({ status: 201, description: 'Subscription plan created' })
  @ApiBadRequestResponse()
  @Post()
  async create(@Body() dto: CreateSubscriptionPlanDto) {
    const data = await this.createSubscriptionPlanCommand.execute(dto);
    return this.responseService.success({
      data,
      message: 'Subscription plan created successfully',
    });
  }

  @ApiOperation({ summary: 'Update a seller subscription plan' })
  @ApiResponse({ status: 200, description: 'Subscription plan updated' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Subscription plan')
  @Patch(':id')
  async update(
    @Param() param: SubscriptionPlanIdParamDto,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    const data = await this.updateSubscriptionPlanCommand.execute(
      param.id,
      dto,
    );
    return this.responseService.success({
      data,
      message: 'Subscription plan updated successfully',
    });
  }

  @ApiOperation({ summary: 'Sync subscription plan to Stripe Product/Price' })
  @ApiResponse({ status: 200, description: 'Subscription plan synced to Stripe' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Subscription plan')
  @Post(':id/sync-stripe')
  async syncStripe(@Param() param: SubscriptionPlanIdParamDto) {
    const data = await this.syncPlanToStripeCommand.execute(param.id);
    return this.responseService.success({
      data,
      message: 'Subscription plan synced to Stripe successfully',
    });
  }

  @ApiOperation({
    summary: 'Retire plan for new purchases (grandfather existing subscribers)',
  })
  @ApiResponse({ status: 200, description: 'Subscription plan retired' })
  @ApiNotFoundResponse('Subscription plan')
  @Patch(':id/retire')
  async retire(@Param() param: SubscriptionPlanIdParamDto) {
    const data = await this.retireSubscriptionPlanCommand.execute(param.id);
    return this.responseService.success({
      data,
      message: 'Subscription plan retired successfully',
    });
  }
}
