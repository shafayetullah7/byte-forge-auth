import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticAdminUser } from '@/libs/decorators/authentic-admin.decorator';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiErrorResponse,
  ApiUnauthorizedResponse,
} from '@/libs/decorators/api-error.decorator';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { CookieService } from '@/libs/modules/cookie/cookie.service';
import { ResponseService } from '@/libs/modules/response/response.service';
import { AuthenticAdmin } from '@/libs/types';
import { getClientIp } from '@/libs/utils/get-client-ip';
import { parseDeviceInfo } from '@/libs/utils/get-divice-info';
import { AdminAuthService } from '../application/admin-auth.service';
import { AdminSessionService } from '../application/admin-session.service';
import { CompleteLocalAdminDto } from './dto/complete.local.admin.dto';
import { CreateLocalAdminDto } from './dto/create.local.admin.dto';
import { LoginLocalAdminDto } from './dto/login.local.admin.dto';

@ApiTags('🔐 Admin Auth')
@Controller({ path: 'admin/auth', version: '1' })
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly adminSessionService: AdminSessionService,
    private readonly cookieService: CookieService,
    private readonly i18n: I18nService,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({
    summary: 'Request admin registration OTP',
    description:
      'Starts admin registration. Sends a one-time code to the gatekeeper email configured in ADMIN_REGISTRATION_OTP_EMAIL (global limit: 1 request per minute).',
  })
  @ApiResponse({ status: 200, description: 'Registration OTP sent to gatekeeper' })
  @ApiBadRequestResponse()
  @ApiConflictResponse('Email or username already exists', 'DUPLICATE_ENTRY')
  @ApiErrorResponse(429, 'Rate limit exceeded', 'TOO_MANY_REQUESTS')
  @Post('register/request-otp')
  async requestRegistrationOtp(@Body() payload: CreateLocalAdminDto) {
    const lang = I18nContext.current()?.lang ?? 'en';
    const result = await this.adminAuthService.requestRegistrationOtp(
      payload,
      lang,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.adminRegistrationOtpSent', {
        lang,
      }),
      data: result,
    });
  }

  @ApiOperation({
    summary: 'Complete admin registration',
    description:
      'Creates an admin account after OTP verification. Payload must match the registration request that received the OTP.',
  })
  @ApiResponse({ status: 201, description: 'Admin successfully registered' })
  @ApiBadRequestResponse('INVALID_OTP')
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async completeRegistration(@Body() payload: CompleteLocalAdminDto) {
    const lang = I18nContext.current()?.lang ?? 'en';
    const result = await this.adminAuthService.completeRegistration(
      payload,
      lang,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.adminRegistered', { lang }),
      data: result,
    });
  }

  @ApiOperation({
    summary: 'Admin login',
    description: 'Authenticates admin and returns session tokens.',
  })
  @ApiResponse({ status: 200, description: 'Admin successfully logged in' })
  @ApiUnauthorizedResponse()
  @Post('login')
  async login(
    @Body() payload: LoginLocalAdminDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = parseDeviceInfo(userAgent);
    const ip = getClientIp(req);

    const { tokens, admin } = await this.adminAuthService.login(
      payload.email,
      payload.password,
      deviceInfo,
      ip,
    );

    this.cookieService.setAdminAccessToken(res, tokens.accessToken);
    this.cookieService.setAdminRefreshToken(res, tokens.refreshToken);

    const xsrfToken = crypto.randomUUID();
    this.cookieService.setXsrfToken(res, xsrfToken);

    return this.responseService.success({
      message: 'Admin logged in successfully',
      data: {
        tokens,
        admin,
      },
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Check if admin is authenticated' })
  @ApiResponse({ status: 200, description: 'Admin is authenticated' })
  @ApiUnauthorizedResponse()
  @UseGuards(AdminAuthGuard)
  @Get('check')
  checkAuth(@AuthenticAdminUser() adminAuth: AuthenticAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, updatedAt, ...adminProfile } = adminAuth.admin;

    return this.responseService.success({
      message: 'Admin authenticated',
      data: adminProfile,
    });
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refreshes the access token using refresh token.',
  })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiUnauthorizedResponse()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.adminRefreshToken as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { tokens, admin } =
      await this.adminAuthService.refreshTokens(refreshToken);

    this.cookieService.setAdminAccessToken(res, tokens.accessToken);

    const xsrfToken = crypto.randomUUID();
    this.cookieService.setXsrfToken(res, xsrfToken);

    return this.responseService.success({
      message: 'Tokens refreshed successfully',
      data: {
        tokens,
        admin,
      },
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Admin successfully logged out' })
  @ApiUnauthorizedResponse()
  @UseGuards(AdminAuthGuard)
  @Post('logout')
  async logout(
    @AuthenticAdminUser() adminAuth: AuthenticAdmin,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.adminSessionService.revokeSession(adminAuth.session.id);
    this.cookieService.clearAdminTokens(res);

    return this.responseService.success({
      message: 'Admin logged out successfully',
      data: null,
    });
  }
}
