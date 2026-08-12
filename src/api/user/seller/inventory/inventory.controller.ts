import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { GetInventoryParamsDto } from './dto/get-inventory-params.dto';
import { GetMovementsQueryDto } from './dto/get-movements-query.dto';
import { RestockVariantDto } from './dto/restock-variant.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { VerifiedUserAuthGuard } from '@/libs/guards/verified-user-auth-guard/verified-user-auth.guard';
import { AuthenticUser } from '@/libs/decorators/authentic-user.decorator';
import { TAuthenticUser } from '@/libs/types';
import { ResponseService } from '@/libs/modules/response/response.service';
import { I18nLang, I18nService } from 'nestjs-i18n';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@/libs/decorators/api-error.decorator';
import {
  InventoryDetailResponseDto,
  InventoryMovementsResponseDto,
  InventoryOperationResponseDto,
} from './dto/inventory-response.dto';

@ApiTags('📦 Seller - Inventory Management')
@Controller({ path: 'user/seller/products', version: '1' })
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'Get product inventory',
    description: 'Returns inventory detail for all variants of a product',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory detail retrieved successfully',
    type: InventoryDetailResponseDto,
  })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Product not found')
  @Get(':id/inventory')
  @UseGuards(VerifiedUserAuthGuard)
  async getInventory(
    @Param() params: GetInventoryParamsDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const { id } = params;
    this.logger.log(
      `Fetching inventory for product ${id} for user ${authenticUser.user.id}`,
    );
    try {
      const inventory = await this.inventoryService.getInventory(
        authenticUser.user.id,
        id,
        lang,
      );
      this.logger.log(`Successfully fetched inventory for product ${id}`);
      return this.responseService.success({
        message: this.i18n.t('message.success.inventoryRetrieved', { lang }),
        data: inventory,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch inventory for product ${id} for user ${authenticUser.user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get stock movements',
    description: 'Returns paginated stock movements with optional filters',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Product ID',
  })
  @ApiQuery({ type: GetMovementsQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Stock movements retrieved successfully',
    type: InventoryMovementsResponseDto,
  })
  @ApiUnauthorizedResponse()
  @Get(':id/inventory/movements')
  @UseGuards(VerifiedUserAuthGuard)
  async getMovements(
    @Param() params: GetInventoryParamsDto,
    @Query() query: GetMovementsQueryDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const { id } = params;
    this.logger.log(
      `Fetching stock movements for product ${id} for user ${authenticUser.user.id}`,
    );
    try {
      const result = await this.inventoryService.getMovements(
        authenticUser.user.id,
        id,
        {
          variantId: query.variantId,
          movementType: query.movementType,
          startDate: query.startDate,
          endDate: query.endDate,
        },
        query.page ?? 1,
        query.limit ?? 20,
        lang,
      );
      this.logger.log(
        `Successfully fetched ${result.movements.length} movements for product ${id}`,
      );
      return this.responseService.success({
        message: this.i18n.t('message.success.movementsRetrieved', { lang }),
        data: result,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch stock movements for product ${id} for user ${authenticUser.user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Restock variant',
    description: 'Add stock to a variant. Creates a RESTOCK movement record.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock restocked successfully',
    type: InventoryOperationResponseDto,
  })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Product or variant not found')
  @Post(':id/inventory/restock')
  @UseGuards(VerifiedUserAuthGuard)
  async restock(
    @Param() params: GetInventoryParamsDto,
    @Body() body: RestockVariantDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const { id } = params;
    this.logger.log(
      `Restocking variant ${body.variantId} for product ${id} by user ${authenticUser.user.id}`,
    );
    try {
      const result = await this.inventoryService.restock(
        authenticUser.user.id,
        id,
        body,
        lang,
      );
      this.logger.log(
        `Successfully restocked variant ${body.variantId} by ${body.quantity} units`,
      );
      return this.responseService.success({
        message: this.i18n.t('message.success.stockRestocked', { lang }),
        data: result,
      });
    } catch (error) {
      this.logger.error(
        `Failed to restock variant ${body.variantId} for product ${id} by user ${authenticUser.user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Adjust stock',
    description:
      'Arbitrary positive or negative stock change. Creates RESTOCK or ADJUSTMENT movement record.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock adjusted successfully',
    type: InventoryOperationResponseDto,
  })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Product or variant not found')
  @Post(':id/inventory/adjust')
  @UseGuards(VerifiedUserAuthGuard)
  async adjust(
    @Param() params: GetInventoryParamsDto,
    @Body() body: AdjustStockDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const { id } = params;
    this.logger.log(
      `Adjusting stock for variant ${body.variantId} for product ${id} by user ${authenticUser.user.id}`,
    );
    try {
      const result = await this.inventoryService.adjust(
        authenticUser.user.id,
        id,
        body,
        lang,
      );
      this.logger.log(
        `Successfully adjusted variant ${body.variantId} by ${body.quantityChange} units`,
      );
      return this.responseService.success({
        message: this.i18n.t('message.success.stockAdjusted', { lang }),
        data: result,
      });
    } catch (error) {
      this.logger.error(
        `Failed to adjust stock for variant ${body.variantId} for product ${id} by user ${authenticUser.user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Mark as damaged',
    description:
      'Remove damaged stock. Creates a DAMAGED movement record. Cannot exceed available stock.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock marked as damaged successfully',
    type: InventoryOperationResponseDto,
  })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Product or variant not found')
  @Post(':id/inventory/damaged')
  @UseGuards(VerifiedUserAuthGuard)
  async damaged(
    @Param() params: GetInventoryParamsDto,
    @Body() body: MarkDamagedDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const { id } = params;
    this.logger.log(
      `Marking damaged stock for variant ${body.variantId} for product ${id} by user ${authenticUser.user.id}`,
    );
    try {
      const result = await this.inventoryService.damaged(
        authenticUser.user.id,
        id,
        body,
        lang,
      );
      this.logger.log(
        `Successfully marked ${body.quantity} units as damaged for variant ${body.variantId}`,
      );
      return this.responseService.success({
        message: this.i18n.t('message.success.stockDamaged', { lang }),
        data: result,
      });
    } catch (error) {
      this.logger.error(
        `Failed to mark damaged stock for variant ${body.variantId} for product ${id} by user ${authenticUser.user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
