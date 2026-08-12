import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { AuthenticUser } from '@/libs/decorators/authentic-user.decorator';
import { TAuthenticUser } from '@/libs/types';
import { VerifiedUserAuthGuard } from '@/libs/guards/verified-user-auth-guard/verified-user-auth.guard';
import { ResponseService } from '@/libs/modules/response/response.service';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@/libs/decorators/api-error.decorator';
import {
  FollowShopCommand,
  UnfollowShopCommand,
} from '../application/commands';
import { ListFollowingShopsQuery } from '../application/queries';
import { ShopSlugParamDto } from './dto/shop-slug-param.dto';

@ApiTags('🏪 Buyer - Shop Follow')
@Controller({ path: 'user/buyer/shops', version: '1' })
@UseGuards(VerifiedUserAuthGuard)
export class BuyerShopFollowController {
  constructor(
    private readonly listFollowingShopsQuery: ListFollowingShopsQuery,
    private readonly followShopCommand: FollowShopCommand,
    private readonly unfollowShopCommand: UnfollowShopCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'List shops followed by the authenticated buyer' })
  @ApiUnauthorizedResponse()
  @Get('following')
  async listFollowing(
    @AuthenticUser() authUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const data = await this.listFollowingShopsQuery.execute(
      authUser.user.id,
      lang,
    );

    return this.responseService.success({
      message: 'Followed shops retrieved successfully',
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Follow a shop' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @ApiBadRequestResponse('Cannot follow own shop / shop not verified')
  @Post(':slug/follow')
  async follow(
    @AuthenticUser() authUser: TAuthenticUser,
    @Param() params: ShopSlugParamDto,
  ) {
    const data = await this.followShopCommand.execute(
      authUser.user.id,
      params.slug,
    );

    return this.responseService.success({
      message: 'Shop followed successfully',
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Unfollow a shop' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  @Delete(':slug/follow')
  async unfollow(
    @AuthenticUser() authUser: TAuthenticUser,
    @Param() params: ShopSlugParamDto,
  ) {
    const data = await this.unfollowShopCommand.execute(
      authUser.user.id,
      params.slug,
    );

    return this.responseService.success({
      message: 'Shop unfollowed successfully',
      data,
    });
  }
}
