import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import { ResponseService } from '@/libs/modules/response/response.service';
import { ListActivePaymentMethodsQuery } from '../application/queries';

@ApiTags('💳 Public - Payment Methods')
@Controller({ path: 'payment-methods', version: '1' })
export class PublicPaymentMethodsController {
  constructor(
    private readonly listActivePaymentMethodsQuery: ListActivePaymentMethodsQuery,
    private readonly responseService: ResponseService,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'List active payment methods',
    description:
      'Returns payment methods enabled for checkout. Inactive catalog entries are excluded.',
  })
  @ApiResponse({ status: 200, description: 'Active payment methods retrieved' })
  @Get()
  async findActive() {
    const data = await this.listActivePaymentMethodsQuery.execute();
    return this.responseService.success({
      data,
      message: 'Active payment methods retrieved successfully',
    });
  }
}
