import { Controller, Get, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ResponseService } from '@/libs/modules/response/response.service';
import { OidcAuthService } from '../application/oidc-auth.service';

@ApiTags('👤 User Auth')
@Controller({ path: 'user/auth/oidc', version: '1' })
export class UserOidcController {
  constructor(
    private readonly oidcAuthService: OidcAuthService,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'Start OIDC login (redirect to Aponika)' })
  @ApiResponse({ status: 302, description: 'Redirect to identity provider' })
  @Get('login')
  login(
    @Query('returnTo') returnTo: string | undefined,
    @Res() res: Response,
  ): void {
    const authorizeUrl = this.oidcAuthService.beginLogin(res, returnTo);
    res.redirect(authorizeUrl);
  }

  @ApiOperation({ summary: 'OIDC authorization callback' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend after login' })
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const redirectUrl = await this.oidcAuthService.completeCallback(req, res, {
      code,
      state,
      error,
      error_description: errorDescription,
    });
    res.redirect(redirectUrl);
  }

  @ApiOperation({ summary: 'Refresh OIDC access token using refresh cookie' })
  @ApiResponse({ status: 200, description: 'OIDC tokens refreshed' })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      await this.oidcAuthService.refreshSession(req, res);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('OIDC refresh failed');
    }

    return this.responseService.success({
      message: 'OIDC tokens refreshed',
      data: null,
    });
  }

  @ApiOperation({
    summary:
      'Federated logout (redirect to IdP end_session — ends Aponika session)',
  })
  @ApiResponse({ status: 302, description: 'Redirect to identity provider logout' })
  @Get('logout')
  async federatedLogout(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const html = await this.oidcAuthService.completeFederatedLogout(req, res);
    res.type('html').send(html);
  }
}
