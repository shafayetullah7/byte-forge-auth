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
import { AuthenticUser } from '@/libs/decorators/authentic-user.decorator';
import { TAuthenticUser } from '@/libs/types';
import { VerifiedUserAuthGuard } from '@/libs/guards/verified-user-auth-guard/verified-user-auth.guard';
import { ResponseService } from '@/libs/modules/response/response.service';
import { ReportSellerReviewCommand } from '../application/commands';
import { ListSellerProductReviewsQuery } from '../application/queries';
import {
  ProductIdParamDto,
  ReportReviewDto,
  ReviewIdParamDto,
  SellerReviewQueryDto,
} from './dto';

@ApiTags('⭐ Seller Reviews')
@Controller({ path: 'user/seller', version: '1' })
@UseGuards(VerifiedUserAuthGuard)
export class SellerReviewsController {
  constructor(
    private readonly listSellerProductReviewsQuery: ListSellerProductReviewsQuery,
    private readonly reportSellerReviewCommand: ReportSellerReviewCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'List reviews for a seller product' })
  @Get('products/:productId/reviews')
  async getProductReviews(
    @AuthenticUser() authUser: TAuthenticUser,
    @Param() params: ProductIdParamDto,
    @Query() query: SellerReviewQueryDto,
  ) {
    const data = await this.listSellerProductReviewsQuery.execute(
      authUser.user.id,
      params.productId,
      query,
    );

    return this.responseService.success({
      message: 'Product reviews retrieved successfully',
      data,
    });
  }

  @ApiOperation({ summary: 'Report a review to admin' })
  @Post('reviews/:reviewId/report')
  async reportReview(
    @AuthenticUser() authUser: TAuthenticUser,
    @Param() params: ReviewIdParamDto,
    @Body() body: ReportReviewDto,
  ) {
    const data = await this.reportSellerReviewCommand.execute(
      authUser.user.id,
      params.reviewId,
      {
        reason: body.reason,
        details: body.details,
      },
    );

    return this.responseService.success({
      message: 'Review reported successfully',
      data,
    });
  }
}
