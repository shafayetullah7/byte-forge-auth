import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@/libs/decorators/api-error.decorator';
import { ApiPagination } from '@/libs/decorators/api-pagination.decorator';
import { ResponseService } from '@/libs/modules/response/response.service';
import { PaginationParams } from '@/libs/schemas/pagination.schema';
import {
  ApproveShopCommand,
  DeactivateShopCommand,
  ReactivateShopCommand,
  RejectShopCommand,
  SuspendShopCommand,
} from '../application/commands';
import {
  GetAdminShopByIdQuery,
  GetPendingVerificationsQuery,
  GetShopStatsQuery,
  GetShopVerificationDetailsQuery,
  ListAdminShopsQuery,
} from '../application/queries';
import { AdminDeactivateShopDto } from './dto/admin-deactivate-shop.dto';
import { AdminRejectShopDto } from './dto/admin-reject-shop.dto';
import { AdminShopIdParamDto } from './dto/admin-shop-id-param.dto';
import { AdminShopQueryDto } from './dto/admin-shop-query.dto';
import { AdminSuspendShopDto } from './dto/admin-suspend-shop.dto';

@ApiTags('🏪 Admin - Shop Management')
@Controller({ path: 'admin/shops', version: '1' })
export class AdminShopsController {
  constructor(
    private readonly getPendingVerificationsQuery: GetPendingVerificationsQuery,
    private readonly listAdminShopsQuery: ListAdminShopsQuery,
    private readonly getAdminShopByIdQuery: GetAdminShopByIdQuery,
    private readonly getShopStatsQuery: GetShopStatsQuery,
    private readonly getShopVerificationDetailsQuery: GetShopVerificationDetailsQuery,
    private readonly approveShopCommand: ApproveShopCommand,
    private readonly rejectShopCommand: RejectShopCommand,
    private readonly suspendShopCommand: SuspendShopCommand,
    private readonly deactivateShopCommand: DeactivateShopCommand,
    private readonly reactivateShopCommand: ReactivateShopCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'Get all pending shop verifications' })
  @ApiResponse({ status: 200, description: 'Pending verifications retrieved' })
  @ApiPagination()
  @ApiUnauthorizedResponse()
  @Get('pending-verifications')
  @UseGuards(AdminAuthGuard)
  async getPendingVerifications(@Query() query: PaginationParams) {
    const verifications =
      await this.getPendingVerificationsQuery.execute(query);
    return this.responseService.paginated({
      message: 'Pending verifications retrieved successfully',
      data: verifications.data,
      meta: verifications.meta,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Approve a shop verification' })
  @ApiResponse({ status: 200, description: 'Shop approved' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Shop')
  @Post(':id/approve')
  @UseGuards(AdminAuthGuard)
  async approveShop(@Param() params: AdminShopIdParamDto) {
    const verification = await this.approveShopCommand.execute(params.id);
    return this.responseService.success({
      message: 'Shop approved successfully',
      data: verification,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Reject a shop verification' })
  @ApiResponse({ status: 200, description: 'Shop rejected' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Shop')
  @Post(':id/reject')
  @UseGuards(AdminAuthGuard)
  async rejectShop(
    @Param() params: AdminShopIdParamDto,
    @Body() dto: AdminRejectShopDto,
  ) {
    const verification = await this.rejectShopCommand.execute(params.id, dto);
    return this.responseService.success({
      message: 'Shop rejected successfully',
      data: verification,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get all shops with filtering',
    description: 'Lists all shops with optional filters.',
  })
  @ApiResponse({ status: 200, description: 'Shops retrieved' })
  @ApiPagination()
  @ApiUnauthorizedResponse()
  @Get()
  @UseGuards(AdminAuthGuard)
  async getAllShops(@Query() query: AdminShopQueryDto) {
    const result = await this.listAdminShopsQuery.execute(query);
    return this.responseService.paginated({
      message: 'Shops retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get shop statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  @ApiUnauthorizedResponse()
  @Get('stats')
  @UseGuards(AdminAuthGuard)
  async getShopStats() {
    const stats = await this.getShopStatsQuery.execute();
    return this.responseService.success({
      message: 'Statistics retrieved successfully',
      data: stats,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get a shop by ID' })
  @ApiResponse({ status: 200, description: 'Shop retrieved' })
  @ApiNotFoundResponse('Shop')
  @Get(':id')
  @UseGuards(AdminAuthGuard)
  async getShopById(@Param() params: AdminShopIdParamDto) {
    const shop = await this.getAdminShopByIdQuery.execute(params.id);
    return this.responseService.success({
      message: 'Shop retrieved successfully',
      data: shop,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get shop verification details',
    description:
      'Retrieves complete verification information including documents, admin notes, and history.',
  })
  @ApiResponse({ status: 200, description: 'Verification details retrieved' })
  @ApiNotFoundResponse('Shop verification')
  @Get(':id/verification')
  @UseGuards(AdminAuthGuard)
  async getShopVerification(@Param() params: AdminShopIdParamDto) {
    const verification = await this.getShopVerificationDetailsQuery.execute(
      params.id,
    );
    return this.responseService.success({
      message: 'Verification details retrieved successfully',
      data: verification,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Suspend an active shop' })
  @ApiResponse({ status: 200, description: 'Shop suspended' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Shop')
  @Post(':id/suspend')
  @UseGuards(AdminAuthGuard)
  async suspendShop(
    @Param() params: AdminShopIdParamDto,
    @Body() dto: AdminSuspendShopDto,
  ) {
    const result = await this.suspendShopCommand.execute(params.id, dto);
    return this.responseService.success({
      message: 'Shop suspended successfully',
      data: result,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Deactivate a shop permanently',
    description: 'Deactivates a shop. This action is irreversible.',
  })
  @ApiResponse({ status: 200, description: 'Shop deactivated' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Shop')
  @Post(':id/deactivate')
  @UseGuards(AdminAuthGuard)
  async deactivateShop(
    @Param() params: AdminShopIdParamDto,
    @Body() dto: AdminDeactivateShopDto,
  ) {
    const result = await this.deactivateShopCommand.execute(params.id, dto);
    return this.responseService.success({
      message: 'Shop deactivated successfully',
      data: result,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Reactivate a suspended or deactivated shop' })
  @ApiResponse({ status: 200, description: 'Shop reactivated' })
  @ApiNotFoundResponse('Shop')
  @Post(':id/reactivate')
  @UseGuards(AdminAuthGuard)
  async reactivateShop(@Param() params: AdminShopIdParamDto) {
    const result = await this.reactivateShopCommand.execute(params.id);
    return this.responseService.success({
      message: 'Shop reactivated successfully',
      data: result,
    });
  }
}
