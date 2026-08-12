import {
  Body,
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
import { UserAuthGuard } from '@/libs/guards/user-auth-guard/user-auth.guard';
import { ResponseService } from '@/libs/modules/response/response.service';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@/libs/decorators/api-error.decorator';
import { AddWishlistItemCommand } from '../application/commands/add-wishlist-item.command';
import { RemoveWishlistItemCommand } from '../application/commands/remove-wishlist-item.command';
import { ListWishlistQuery } from '../application/queries/list-wishlist.query';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { VariantIdParamDto } from './dto/variant-id-param.dto';

@ApiTags('❤️ Buyer - Wishlist')
@Controller({ path: 'user/buyer/wishlist', version: '1' })
@UseGuards(UserAuthGuard)
export class WishlistController {
  constructor(
    private readonly listWishlistQuery: ListWishlistQuery,
    private readonly addWishlistItemCommand: AddWishlistItemCommand,
    private readonly removeWishlistItemCommand: RemoveWishlistItemCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'Get the authenticated buyer wishlist' })
  @ApiUnauthorizedResponse()
  @Get()
  async listItems(
    @AuthenticUser() authUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const data = await this.listWishlistQuery.execute(authUser.user.id, lang);

    return this.responseService.success({
      message: 'Wishlist retrieved successfully',
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Add a variant to the wishlist' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Variant not found')
  @ApiBadRequestResponse('Product not available')
  @Post('items')
  async addItem(
    @AuthenticUser() authUser: TAuthenticUser,
    @Body() dto: AddWishlistItemDto,
  ) {
    const data = await this.addWishlistItemCommand.execute(
      authUser.user.id,
      dto.variantId,
    );

    return this.responseService.success({
      message: 'Item added to wishlist successfully',
      data,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Remove a variant from the wishlist' })
  @ApiUnauthorizedResponse()
  @Delete('items/:variantId')
  async removeItem(
    @AuthenticUser() authUser: TAuthenticUser,
    @Param() params: VariantIdParamDto,
  ) {
    const data = await this.removeWishlistItemCommand.execute(
      authUser.user.id,
      params.variantId,
    );

    return this.responseService.success({
      message: 'Item removed from wishlist successfully',
      data,
    });
  }
}
