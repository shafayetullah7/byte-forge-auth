import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserAuthService } from '../application/user-auth.service';
import { UserAuthV2Service } from '../application/user-auth-v2.service';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { parseDeviceInfo } from '@/libs/utils/get-divice-info';
import { getClientIp } from '@/libs/utils/get-client-ip';
import { CreateLocalUserDto } from './dto/create-local-user.dto';
import { CookieService } from '@/libs/modules/cookie/cookie.service';
import { UserAuthGuard } from '@/libs/guards/user-auth-guard/user-auth.guard';
import { AuthenticUser } from '@/libs/decorators/authentic-user.decorator';
import { AccessUserAuth } from '@/libs/types';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/libs/modules/response/response.service';
import { JwtResourceGuard } from '@/libs/auth/jwt-resource.guard';
import { OidcAccessToken } from '@/libs/decorators/oidc-access-token.decorator';
import { OidcAccessTokenContext } from '@/libs/types/oidc-access-token.type';
import { OidcIdentityProvisionerService } from '../application/oidc-identity-provisioner.service';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';

// import { LocalLoginDto } from './dto/local-login.dto';

import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@/libs/decorators/api-error.decorator';

@ApiTags('👤 User Auth')
@Controller({ path: 'user/auth', version: '1' })
export class UserAuthController {
  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly userAuthV2Service: UserAuthV2Service,
    private readonly cookieService: CookieService,
    private readonly i18n: I18nService,
    private readonly responseService: ResponseService,
    private readonly eventEmitter: EventEmitter2,
    private readonly oidcProvisioner: OidcIdentityProvisionerService,
    private readonly appConfig: AppConfigService,
  ) {}

  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with email and password.',
  })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiBadRequestResponse()
  @Post('register')
  async register(@Body() payload: CreateLocalUserDto) {
    if (!this.appConfig.legacyLoginEnabled) {
      throw new ForbiddenException('Legacy registration is disabled');
    }
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';
    const result = await this.userAuthService.register(payload, lang);
    return this.responseService.success({
      message: this.i18n.t('message.success.userCreated', { lang }),
      data: result,
    });
  }

  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticates user and returns session tokens.',
  })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiUnauthorizedResponse()
  @Post('login')
  async login(
    @Body() payload: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!this.appConfig.legacyLoginEnabled) {
      throw new ForbiddenException('Legacy login is disabled');
    }

    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';

    // 1. Validate credentials manually
    const userAuth = await this.userAuthService.validateCredentials(
      { email: payload.email, password: payload.password },
      lang,
    );

    // 2. Perform login (session creation)
    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = parseDeviceInfo(userAgent);
    const ip = getClientIp(req);
    const result = await this.userAuthService.login({
      user: userAuth.user,
      deviceInfo,
      ip,
    });

    this.cookieService.setSessionCookie(res, result.id);
    this.cookieService.setUserXsrfToken(res, crypto.randomUUID());

    const guestToken = (req as Request & { guestToken: string }).guestToken;

    this.eventEmitter.emit('auth.user.loggedin', {
      userId: userAuth.user.id,
      guestToken,
    });

    let verification: { expiresAt: Date; sent?: boolean } | undefined;
    if (!userAuth.user.emailVerifiedAt) {
      verification = await this.userAuthService.sendAccountVerificationOtp(
        userAuth.user.id,
        lang,
        { force: false },
      );
    }

    return this.responseService.success({
      message: this.i18n.t('message.success.userLoggedIn', { lang }),
      data: {
        session: result,
        user: userAuth.user,
        verification,
      },
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Check if user is authenticated' })
  @ApiResponse({ status: 200, description: 'User is authenticated' })
  @ApiUnauthorizedResponse()
  @UseGuards(UserAuthGuard)
  @Get('/check')
  checkAuth(@AuthenticUser() auth: AccessUserAuth) {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';

    const { user } = auth;

    return this.responseService.success({
      message: this.i18n.t('message.success.userAuthenticated', { lang }),
      data: user,
    });
  }

  @ApiOperation({ summary: 'Check OIDC Bearer authentication' })
  @ApiResponse({ status: 200, description: 'OIDC user authenticated' })
  @ApiUnauthorizedResponse()
  @UseGuards(JwtResourceGuard)
  @Get('oidc-check')
  async oidcCheck(@OidcAccessToken() token: OidcAccessTokenContext) {
    const user = await this.oidcProvisioner.provisionFromToken(token);

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

  @ApiAuth()
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiUnauthorizedResponse()
  @UseGuards(UserAuthGuard)
  @Post('verify-email')
  async verifyEmail(
    @AuthenticUser() auth: AccessUserAuth,
    @Body() payload: VerifyEmailDto,
  ) {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';

    await this.userAuthService.verifyEmail(auth.user.id, payload.otp);

    return this.responseService.success({
      message: this.i18n.t('message.success.emailVerified', { lang }),
      data: null,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiUnauthorizedResponse()
  @UseGuards(UserAuthGuard)
  @Post('send-verification-email')
  async sendVerificationEmail(@AuthenticUser() auth: AccessUserAuth) {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';

    const { expiresAt, sent } =
      await this.userAuthService.sendAccountVerificationOtp(
        auth.user.id,
        lang,
        { force: false },
      );

    return this.responseService.success({
      message: sent
        ? this.i18n.t('message.success.verificationSent', { lang })
        : this.i18n.t('message.success.verificationActive', { lang }),
      data: { expiresAt, sent },
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @ApiUnauthorizedResponse()
  @UseGuards(UserAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const i18nContext = I18nContext.current();
    const lang = i18nContext ? i18nContext.lang : 'en';
    const sessionId = req.cookies?.['sessionId'] as string | undefined;
    if (sessionId) {
      await this.userAuthService.logout(sessionId);
    }
    this.cookieService.clearSessionCookie(res);

    return this.responseService.success({
      message: this.i18n.t('message.success.loggedOut', { lang }),
      data: null,
    });
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Refreshes both access and refresh tokens using current refresh token. Old tokens are invalidated via session ID rotation.',
  })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiUnauthorizedResponse()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.userRefreshToken as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      const { tokens, user } =
        await this.userAuthV2Service.refreshTokens(refreshToken);

      // Set new access token (rotated)
      this.cookieService.setUserAccessToken(res, tokens.accessToken);

      // Set new refresh token (rotated - old one is now invalid due to session ID change)
      this.cookieService.setUserRefreshToken(res, tokens.refreshToken);

      // Rotate XSRF Token (for CSRF protection)
      const xsrfToken = crypto.randomUUID();
      this.cookieService.setUserXsrfToken(res, xsrfToken);

      return this.responseService.success({
        message: 'Tokens refreshed successfully',
        data: {
          tokens,
          user,
        },
      });
    } catch (error) {
      // Clear tokens on auth failure (user deactivated, session revoked, etc.)
      this.cookieService.clearUserTokens(res);
      throw error;
    }
  }

  // === Password Reset Flow ===
}
