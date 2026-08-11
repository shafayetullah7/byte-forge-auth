import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { VerificationStatus } from './shop.types';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { VerifiedUserAuthGuard } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard';
import { AuthenticUser } from '@/common/decorators/authentic-user.decorator';
import { AuthenticShop } from '@/common/decorators/authentic-shop.decorator';
import { TAuthenticUser, TAuthorizedShop } from '@/common/types';
import { SellerShopGuard } from '@/common/guards/seller-shop-guard/seller-shop.guard';
import { ResponseService } from '@/common/modules/response/response.service';
import { SuccessResponse } from '@/common/modules/response/dto/success.response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import { ApiConsumes } from '@nestjs/swagger';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@/common/decorators/api-error.decorator';

@ApiTags('🏪 Seller - Shop Setup')
@Controller({ path: 'user/seller/shops', version: '1' })
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'Get shop verification status',
    description:
      "Returns the current verification status of the user's shop, including document status and any rejection reasons.",
  })
  @ApiResponse({ status: 200, description: 'Verification status retrieved' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Shop')
  @Get('my-shop/verification')
  @UseGuards(VerifiedUserAuthGuard)
  async getMyShopVerification(
    @AuthenticUser() authenticUser: TAuthenticUser,
  ): Promise<SuccessResponse<VerificationStatus>> {
    const verification = await this.shopService.getVerificationStatus(
      authenticUser.user.id,
    );

    if (!verification) {
      throw new CustomException({
        message: this.i18n.t('message.error.shopNotFound', { lang: 'en' }),
        statusCode: 404,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return this.responseService.success({
      message: 'Verification status retrieved',
      data: verification,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Update shop verification documents',
    description:
      'Updates verification documents (trade license, TIN, utility bill). Resets verification status to PENDING when documents are updated.',
  })
  @ApiResponse({ status: 200, description: 'Verification documents updated' })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Shop')
  @Patch('my-shop/verification')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async updateMyShopVerification(
    @Body() dto: UpdateVerificationDto,
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<VerificationStatus>> {
    const verification = await this.shopService.updateVerificationDocuments(
      shop.id,
      dto,
      lang,
    );

    if (!verification) {
      throw new CustomException({
        message: this.i18n.t('message.error.verificationNotFound', { lang }),
        statusCode: 404,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return this.responseService.success({
      message: this.i18n.t('message.success.verificationUpdated', { lang }),
      data: verification,
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Submit shop for review (major changes)',
    description:
      'Submits major changes (name, address) for admin re-verification',
  })
  @ApiResponse({ status: 200, description: 'Shop submitted for review' })
  @Patch('my-shop/submit-for-review')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async submitForReview(
    @Body() dto: UpdateShopDto,
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<any>> {
    await this.shopService.submitForReview(shop.id, dto, lang);
    return this.responseService.success({
      message: this.i18n.t('message.success.shopSubmittedForReview', { lang }),
      data: {},
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Upload shop images (logo, banner)' })
  @ApiResponse({ status: 200, description: 'Images uploaded successfully' })
  @ApiConsumes('multipart/form-data')
  @Post('my-shop/images')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async uploadImages(
    @Body() files: { logo?: Express.Multer.File; banner?: Express.Multer.File },
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<{ logoId?: string; bannerId?: string }>> {
    const result = await this.shopService.uploadImages(shop.id, files);
    return this.responseService.success({
      message: this.i18n.t('message.success.imagesUploaded', { lang }),
      data: result,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Delete shop' })
  @ApiResponse({ status: 200, description: 'Shop deleted successfully' })
  @ApiConflictResponse('Shop has pending orders')
  @Delete('my-shop')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async deleteShop(
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<any>> {
    await this.shopService.deleteShop(shop.id, lang);
    return this.responseService.success({
      message: this.i18n.t('message.success.shopDeleted', { lang }),
      data: {},
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get shop verification history' })
  @ApiResponse({ status: 200, description: 'Verification history retrieved' })
  @Get('my-shop/history')
  @UseGuards(VerifiedUserAuthGuard, SellerShopGuard)
  async getVerificationHistory(
    @AuthenticShop() shop: TAuthorizedShop,
    @I18nLang() lang: string,
  ): Promise<SuccessResponse<any[]>> {
    const history = await this.shopService.getVerificationHistory(
      shop.id,
      lang,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.historyRetrieved', { lang }),
      data: history,
    });
  }
}
