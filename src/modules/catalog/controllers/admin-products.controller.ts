import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { AdminAuthGuard } from '@/common/guards/admin-auth-guard/admin-auth.guard';
import { ResponseService } from '@/common/modules/response/response.service';
import {
  ArchiveAdminProductCommand,
  RestoreAdminProductCommand,
} from '../application/commands/admin-products.command';
import {
  GetAdminProductByIdQuery,
  ListAdminProductsQuery,
} from '../application/queries/admin-products.query';
import {
  AdminProductIdParamDto,
  AdminProductsQueryDto,
  ArchiveProductDto,
} from './dto/admin-products-query.dto';

@ApiTags('🌱 Admin Products')
@Controller({ path: 'admin/products', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminProductsController {
  constructor(
    private readonly listAdminProductsQuery: ListAdminProductsQuery,
    private readonly getAdminProductByIdQuery: GetAdminProductByIdQuery,
    private readonly archiveAdminProductCommand: ArchiveAdminProductCommand,
    private readonly restoreAdminProductCommand: RestoreAdminProductCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'List products for moderation' })
  @Get()
  async listProducts(
    @Query() query: AdminProductsQueryDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.listAdminProductsQuery.execute(query, lang);
    return this.responseService.paginated({
      message: 'Products retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiOperation({ summary: 'Get product detail' })
  @Get(':productId')
  async getProduct(@Param() params: AdminProductIdParamDto) {
    const data = await this.getAdminProductByIdQuery.execute(params.productId);
    return this.responseService.success({
      message: 'Product retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Archive a product (hide from public catalog)' })
  @Patch(':productId/archive')
  async archiveProduct(
    @Param() params: AdminProductIdParamDto,
    @Body() dto: ArchiveProductDto,
  ) {
    const result = await this.archiveAdminProductCommand.execute(
      params.productId,
      dto,
    );
    return this.responseService.success({
      message: result.message,
      data: null,
    });
  }

  @ApiOperation({ summary: 'Restore an archived product to active' })
  @Patch(':productId/restore')
  async restoreProduct(@Param() params: AdminProductIdParamDto) {
    const result = await this.restoreAdminProductCommand.execute(
      params.productId,
    );
    return this.responseService.success({
      message: result.message,
      data: null,
    });
  }
}
