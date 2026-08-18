import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { UserCsrfGuard } from '@/libs/security/user-csrf.guard';
import { Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/libs/modules/response/response.service';
import { JwtResourceGuard } from '@/libs/auth/jwt-resource.guard';
import { OidcAccessToken } from '@/libs/decorators/oidc-access-token.decorator';
import { OidcAccessTokenContext } from '@/libs/types/oidc-access-token.type';
import { OidcIdentityProvisionerService } from '../application/oidc-identity-provisioner.service';
import { OidcAuthService } from '../application/oidc-auth.service';
import { ApiUnauthorizedResponse } from '@/libs/decorators/api-error.decorator';

@ApiTags('👤 User Auth')
@Controller({ path: 'user/auth', version: '1' })
export class UserAuthController {
  constructor(
    private readonly i18n: I18nService,
    private readonly responseService: ResponseService,
    private readonly oidcProvisioner: OidcIdentityProvisionerService,
    private readonly oidcAuthService: OidcAuthService,
  ) {}

  @ApiOperation({ summary: 'Check OIDC Bearer authentication' })
  @ApiResponse({ status: 200, description: 'OIDC user authenticated' })
  @ApiUnauthorizedResponse()
  @UseGuards(JwtResourceGuard)
  @Get('oidc-check')
  async oidcCheck(@OidcAccessToken() token: OidcAccessTokenContext) {
    const user = await this.oidcProvisioner.resolveFromToken(token);

    return this.responseService.success({
      message: 'OIDC user authenticated',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        emailVerified: Boolean(user.emailVerifiedAt),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }

  @ApiOperation({
    summary: 'Logout user (local)',
    description:
      'Clears Byte Forge OIDC cookies on this app. Aponika session may remain for fast re-login.',
  })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @UseGuards(UserCsrfGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';

    this.oidcAuthService.endLocalSession(res);

    return this.responseService.success({
      message: this.i18n.t('message.success.loggedOut', { lang }),
      data: null,
    });
  }
}
