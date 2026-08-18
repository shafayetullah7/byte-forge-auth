import { Injectable } from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { AppConfigService } from '../app-config/app-config.service';

const BF_XSRF_COOKIE = 'bf-xsrf-token';
const BF_XSRF_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class CookieService {
  constructor(private readonly configService: AppConfigService) {}

  /** Shared across :3000 / :3005 when COOKIE_DOMAIN=localhost (matches Aponika pattern). */
  private resolveUserCookieDomain(): string | undefined {
    const domain = this.configService.cookieDomain?.trim();
    return domain || undefined;
  }

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
      domain: this.resolveUserCookieDomain(),
      path: '/',
    };
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
      secure: true,
      maxAge: 3600000,
      sameSite: 'none',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    });
  }

  setAdminRefreshToken(res: Response, token: string) {
    const isProduction = this.configService.nodeEnv === 'production';

    res.cookie('adminRefreshToken', token, {
      httpOnly: true,
      secure: true,
      maxAge: this.configService.sessionMaxAge,
      sameSite: 'none',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    });
  }

  setXsrfToken(res: Response, token: string) {
    const isProduction = this.configService.nodeEnv === 'production';

    res.cookie('xsrf-token', token, {
      httpOnly: false,
      secure: true,
      maxAge: this.configService.sessionMaxAge,
      sameSite: 'none',
      domain: isProduction ? this.configService.cookieDomain : undefined,
      path: '/',
    });
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

  clearGuestTokenCookie(res: Response) {
    res.clearCookie('guestToken', this.getUserCookieOptions(true));
  }

  getGuestTokenCookieOptions(): CookieOptions {
    return this.getUserCookieOptions(true);
  }

  setBfXsrfToken(res: Response, token: string = randomUUID()): string {
    res.cookie(BF_XSRF_COOKIE, token, {
      ...this.getUserCookieOptions(false),
      maxAge: BF_XSRF_MAX_AGE_MS,
    });
    return token;
  }

  setOidcPkceCookies(
    res: Response,
    options: {
      verifier: string;
      state: string;
      nonce: string;
      returnTo?: string;
      maxAgeMs: number;
    },
  ): void {
    const cookieOptions = {
      ...this.getUserCookieOptions(true),
      maxAge: options.maxAgeMs,
    };

    res.cookie('bfOidcVerifier', options.verifier, cookieOptions);
    res.cookie('bfOidcState', options.state, cookieOptions);
    res.cookie('bfOidcNonce', options.nonce, cookieOptions);
    if (options.returnTo) {
      res.cookie('bfOidcReturnTo', options.returnTo, cookieOptions);
    }
  }

  clearOidcPkceCookies(res: Response): void {
    const options = this.getUserCookieOptions(true);
    for (const name of [
      'bfOidcVerifier',
      'bfOidcState',
      'bfOidcNonce',
      'bfOidcReturnTo',
    ]) {
      res.clearCookie(name, options);
    }
  }

  setOidcSessionCookies(
    res: Response,
    tokens: {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
      expires_in?: number;
    },
  ): void {
    const accessMaxAge = (tokens.expires_in ?? 900) * 1000;
    const refreshMaxAge = BF_XSRF_MAX_AGE_MS;
    const accessOptions = {
      ...this.getUserCookieOptions(true),
      maxAge: accessMaxAge,
    };
    const refreshOptions = {
      ...this.getUserCookieOptions(true),
      maxAge: refreshMaxAge,
    };

    res.cookie('bfAccessToken', tokens.access_token, accessOptions);

    if (tokens.refresh_token) {
      res.cookie('bfRefreshToken', tokens.refresh_token, refreshOptions);
    } else {
      res.clearCookie('bfRefreshToken', this.getUserCookieOptions(true));
    }

    this.setBfXsrfToken(res);
  }

  clearOidcSessionCookies(res: Response): void {
    const httpOnlyOptions = this.getUserCookieOptions(true);
    const publicOptions = this.getUserCookieOptions(false);

    // bfIdToken is no longer set; still clear leftovers from older sessions.
    for (const name of ['bfAccessToken', 'bfRefreshToken', 'bfIdToken']) {
      res.clearCookie(name, httpOnlyOptions);
    }
    res.clearCookie(BF_XSRF_COOKIE, publicOptions);
  }
}
