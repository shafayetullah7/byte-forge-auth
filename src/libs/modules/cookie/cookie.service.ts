import { Injectable } from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { AppConfigService } from '../app-config/app-config.service';

@Injectable()
export class CookieService {
  constructor(private readonly configService: AppConfigService) {}

  /**
   * Shared cookie options for user-facing cross-domain auth cookies.
   * Production: Secure + SameSite=None for cross-origin frontends.
   * Development: relaxed for http://localhost.
   */
  private getUserCookieOptions(httpOnly: boolean): CookieOptions {
    const isProduction = this.configService.nodeEnv === 'production';

    return {
      httpOnly,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    };
  }

  setSessionCookie(res: Response, token: string) {
    res.cookie('sessionId', token, {
      ...this.getUserCookieOptions(true),
      maxAge: this.configService.sessionMaxAge,
    });
  }

  setAdminSessionCookie(res: Response, token: string) {
    const isProduction = this.configService.nodeEnv === 'production';

    res.cookie('adminSessionId', token, {
      httpOnly: true,
      secure: isProduction,
      maxAge: this.configService.sessionMaxAge,
      sameSite: isProduction ? 'strict' : 'lax',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    });
  }

  setAdminAccessToken(res: Response, token: string) {
    const isProduction = this.configService.nodeEnv === 'production';

    res.cookie('adminAccessToken', token, {
      httpOnly: true,
      secure: true, // Required for SameSite: None
      maxAge: 3600000, // 1 hour (Access Token lifetime)
      sameSite: 'none',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    });
  }

  setAdminRefreshToken(res: Response, token: string) {
    const isProduction = this.configService.nodeEnv === 'production';

    res.cookie('adminRefreshToken', token, {
      httpOnly: true,
      secure: true, // Required for SameSite: None
      maxAge: this.configService.sessionMaxAge,
      sameSite: 'none',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    });
  }

  setXsrfToken(res: Response, token: string) {
    const isProduction = this.configService.nodeEnv === 'production';

    res.cookie('xsrf-token', token, {
      httpOnly: false, // Must be readable by frontend
      secure: true,
      maxAge: this.configService.sessionMaxAge,
      sameSite: 'none',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    });
  }

  setUserAccessToken(res: Response, token: string) {
    const isProduction = this.configService.nodeEnv === 'production';

    res.cookie('userAccessToken', token, {
      httpOnly: true,
      secure: true, // Required for SameSite: None
      maxAge: 15 * 60 * 1000, // 15 minutes (Access Token lifetime)
      sameSite: 'none',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    });
  }

  setUserRefreshToken(res: Response, token: string) {
    const isProduction = this.configService.nodeEnv === 'production';

    res.cookie('userRefreshToken', token, {
      httpOnly: true,
      secure: true, // Required for SameSite: None
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (Refresh Token lifetime)
      sameSite: 'none',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    });
  }

  setUserXsrfToken(res: Response, token: string) {
    res.cookie('userXsrfToken', token, {
      ...this.getUserCookieOptions(false),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (same as refresh token)
    });
  }

  clearSessionCookie(res: Response) {
    res.clearCookie('sessionId', this.getUserCookieOptions(true));
  }

  clearAdminSessionCookie(res: Response) {
    const isProduction = this.configService.nodeEnv === 'production';

    res.clearCookie('adminSessionId', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    });
  }

  clearAdminTokens(res: Response) {
    const isProduction = this.configService.nodeEnv === 'production';

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    };

    res.clearCookie('adminAccessToken', options);
    res.clearCookie('adminRefreshToken', options);
    res.clearCookie('xsrf-token', { ...options, httpOnly: false });
  }

  clearUserTokens(res: Response) {
    const isProduction = this.configService.nodeEnv === 'production';

    const jwtOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    };

    res.clearCookie('userAccessToken', jwtOptions);
    res.clearCookie('userRefreshToken', jwtOptions);
    res.clearCookie('userXsrfToken', this.getUserCookieOptions(false));
  }

  clearGuestTokenCookie(res: Response) {
    res.clearCookie('guestToken', this.getUserCookieOptions(true));
  }

  getGuestTokenCookieOptions(): CookieOptions {
    return this.getUserCookieOptions(true);
  }
}
