import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { AuthenticUser } from '@/common/decorators/authentic-user.decorator';
import { TAuthenticUser } from '@/common/types';
import { UserAuthGuard } from '@/common/guards/user-auth-guard/user-auth.guard';
import { ResponseService } from '@/common/modules/response/response.service';
import { CreateBuyerReviewCommand } from '../application/commands';
import {
  GetBuyerReviewEligibilityQuery,
  ListBuyerReviewsQuery,
} from '../application/queries';
import {
  CreateReviewDto,
  ListBuyerReviewsQueryDto,
  OrderItemParamDto,
} from './dto';

@ApiTags('⭐ Buyer Reviews')
@Controller({ path: 'user/buyer/reviews', version: '1' })
@UseGuards(UserAuthGuard)
export class BuyerReviewsController {
  constructor(
    private readonly listBuyerReviewsQuery: ListBuyerReviewsQuery,
    private readonly getBuyerReviewEligibilityQuery: GetBuyerReviewEligibilityQuery,
    private readonly createBuyerReviewCommand: CreateBuyerReviewCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'List reviews written by the authenticated buyer' })
  @Get()
  async listReviews(
    @AuthenticUser() authUser: TAuthenticUser,
    @Query() query: ListBuyerReviewsQueryDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.listBuyerReviewsQuery.execute(
      authUser.user.id,
      query,
      lang,
    );

    return this.responseService.paginated({
      message: 'Reviews retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @ApiOperation({ summary: 'Check if an order item can be reviewed' })
  @Get('eligibility/:orderItemId')
  async getEligibility(
    @AuthenticUser() authUser: TAuthenticUser,
    @Param() params: OrderItemParamDto,
  ) {
    const data = await this.getBuyerReviewEligibilityQuery.execute(
      authUser.user.id,
      params.orderItemId,
    );

    return this.responseService.success({
      message: 'Review eligibility retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Create a verified purchase review' })
  @Post()
  async createReview(
    @AuthenticUser() authUser: TAuthenticUser,
    @Body() dto: CreateReviewDto,
  ) {
    const data = await this.createBuyerReviewCommand.execute(authUser.user.id, {
      orderItemId: dto.orderItemId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
    });

    return this.responseService.success({
      message: 'Review submitted for moderation',
      data,
    });
  }
}
