import { Controller, Get, UseGuards } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticUser } from '@/common/decorators/authentic-user.decorator';
import { ApiAuth } from '@/common/decorators/swagger.decorators';
import { ApiUnauthorizedResponse } from '@/common/decorators/api-error.decorator';
import { UserAuthGuard } from '@/common/guards/user-auth-guard/user-auth.guard';
import { ResponseService } from '@/common/modules/response/response.service';
import { TAuthenticUser } from '@/common/types';
import { GetProfileQuery } from '../application/queries/get-profile.query';

@ApiTags('👤 User Profile')
@Controller({ path: 'user/profile', version: '1' })
export class UserProfileController {
  constructor(
    private readonly getProfileQuery: GetProfileQuery,
    private readonly i18n: I18nService,
    private readonly responseService: ResponseService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiUnauthorizedResponse()
  @UseGuards(UserAuthGuard)
  @Get()
  async getUser(@AuthenticUser() userAuth: TAuthenticUser) {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';
    const { user } = userAuth;

    const result = await this.getProfileQuery.execute(user.id);

    return this.responseService.success({
      message: this.i18n.t('message.success.userRetrieved', { lang }),
      data: result.user,
    });
  }
}
