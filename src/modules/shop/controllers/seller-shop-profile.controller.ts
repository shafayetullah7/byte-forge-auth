import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { AuthenticUser } from '@/common/decorators/authentic-user.decorator';
import { AuthenticShop } from '@/common/decorators/authentic-shop.decorator';
import { TAuthenticUser, TAuthorizedShop } from '@/common/types';
import { VerifiedUserAuthGuard } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard';
import { SellerShopGuard } from '@/common/guards/seller-shop-guard/seller-shop.guard';
import { ResponseService } from '@/common/modules/response/response.service';
import { SuccessResponse } from '@/common/modules/response/dto/success.response.dto';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@/common/decorators/api-error.decorator';
import {
  UpdateMyShopBrandingCommand,
  UpdateMyShopCommand,
  UpsertMyShopInfoCommand,
} from '../application/commands';
import { GetMyShopQuery, GetShopStatusQuery } from '../application/queries';
import type {
  LocalizedShopDetails,
  MyShopStatusResponse,
} from '../mappers/shop.mapper.types';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateShopInfoDto } from './dto/update-shop-info.dto';

@ApiTags('🏪 Seller - Shop Setup')
@Controller({ path: 'user/seller/shops', version: '1' })
export class SellerShopProfileController {
  constructor(
    private readonly getShopStatusQuery: GetShopStatusQuery,
    private readonly getMyShopQuery: GetMyShopQuery,
    private readonly updateMyShopCommand: UpdateMyShopCommand,
    private readonly updateMyShopBrandingCommand: UpdateMyShopBrandingCommand,
    private readonly upsertMyShopInfoCommand: UpsertMyShopInfoCommand,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'Check shop status',
    description:
      'Returns minimal shop information to check if user has a shop setup. Used for routing decisions (redirect to shop dashboard or setup form). Returns 404 if no shop exists.',
  })
  @ApiResponse({ status: 200, description: 'Shop status retrieved' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Shop')
  @Get('my-shop/status')
  @UseGuards(VerifiedUserAuthGuard)
  async getMyShopStatus(
    @AuthenticUser() authenticUser: TAuthenticUser,
  ): Promise<SuccessResponse<MyShopStatusResponse>> {
    const shopStatus = await this.getShopStatusQuery.execute(
      authenticUser.user.id,
    );

    if (!shopStatus) {
      throw new CustomException({
        message: this.i18n.t('message.error.shopNotFound', { lang: 'en' }),
        statusCode: 404,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return this.responseService.success({
      message: 'Shop status retrieved',
      data: shopStatus,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get localized shop details',
    description:
      "Retrieves the authenticated user's shop details with translations, logo, and banner. Returns 404 if no shop exists.",
  })
  @ApiResponse({ status: 200, description: 'Shop details retrieved' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Shop')
  @Get('my-shop')
  @UseGuards(VerifiedUserAuthGuard)
  async getMyShop(
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<LocalizedShopDetails>> {
    const shopDetails = await this.getMyShopQuery.execute(
      authenticUser.user.id,
      lang,
    );

    if (!shopDetails) {
      throw new CustomException({
        message: this.i18n.t('message.error.shopNotFound', { lang }),
        statusCode: 404,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return this.responseService.success({
      message: this.i18n.t('message.success.shopRetrieved', { lang }),
      data: shopDetails,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Update my shop' })
  @ApiResponse({ status: 200, description: 'Shop updated' })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @Patch('my-shop')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async updateMyShop(
    @Body() dto: UpdateShopDto,
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<LocalizedShopDetails>> {
    const updatedShop = await this.updateMyShopCommand.execute(
      shop.id,
      dto,
      lang,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.shopUpdated', { lang }),
      data: updatedShop,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Update shop branding' })
  @ApiResponse({ status: 200, description: 'Branding updated' })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @Patch('my-shop/branding')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async updateMyBranding(
    @Body() dto: UpdateBrandingDto,
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<LocalizedShopDetails>> {
    const updatedShop = await this.updateMyShopBrandingCommand.execute(
      shop.id,
      dto,
      lang,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.brandingUpdated', { lang }),
      data: updatedShop,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Update shop info (branding + translations)',
    description:
      'Updates shop branding (logo, banner, colors) and bilingual translations (name, description, business hours). Handles media usage counting automatically.',
  })
  @ApiResponse({ status: 200, description: 'Shop info updated' })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @Put('my-shop')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async upsertMyShopInfo(
    @Body() dto: UpdateShopInfoDto,
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<LocalizedShopDetails>> {
    const updatedShop = await this.upsertMyShopInfoCommand.execute(
      shop.id,
      dto,
      lang,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.shopUpdated', { lang }),
      data: updatedShop,
    });
  }
}
