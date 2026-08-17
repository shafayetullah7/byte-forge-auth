import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateOidcState,
} from '@/libs/auth/oidc/oidc-pkce.util';
import {
  buildFrontendRedirect,
  safeReturnTo,
} from '@/libs/auth/oidc/oidc-return-to.util';
import type { OidcTokenResponse } from '@/libs/auth/oidc/oidc-token.types';
import { CookieService } from '@/libs/modules/cookie/cookie.service';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';

const PKCE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

type OidcCallbackQuery = {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
};

@Injectable()
export class OidcAuthService {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly cookieService: CookieService,
  ) {}

  beginLogin(res: Response, returnTo?: string): string {
    const verifier = generateCodeVerifier();
    const state = generateOidcState();
    const authorizeUrl = this.buildAuthorizeUrl(verifier, state);

    this.cookieService.setOidcPkceCookies(res, {
      verifier,
      state,
      returnTo: safeReturnTo(returnTo),
      maxAgeMs: PKCE_COOKIE_MAX_AGE_MS,
    });

    return authorizeUrl;
  }

  async completeCallback(
    req: Request,
    res: Response,
    query: OidcCallbackQuery,
  ): Promise<string> {
    const frontendUrl = this.appConfig.frontendUrl;

    if (query.error) {
      this.cookieService.clearOidcPkceCookies(res);
      return `${frontendUrl.replace(/\/$/, '')}/login?oidc_error=${encodeURIComponent(query.error)}`;
    }

    if (!query.code || !query.state) {
      this.cookieService.clearOidcPkceCookies(res);
      throw new BadRequestException('Missing authorization code or state');
    }

    const pkce = this.readPkceCookies(req);
    if (!pkce.verifier || !pkce.state || pkce.state !== query.state) {
      this.cookieService.clearOidcPkceCookies(res);
      throw new BadRequestException('Invalid or expired OIDC login state');
    }

    try {
      const tokens = await this.exchangeAuthorizationCode(
        query.code,
        pkce.verifier,
      );
      this.cookieService.setOidcSessionCookies(res, tokens);
      this.cookieService.clearOidcPkceCookies(res);

      return buildFrontendRedirect(frontendUrl, pkce.returnTo);
    } catch (error) {
      this.cookieService.clearOidcPkceCookies(res);
      this.cookieService.clearOidcSessionCookies(res);
      throw error;
    }
  }

  async refreshSession(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.bfRefreshToken as string | undefined;
    if (!refreshToken?.trim()) {
      throw new UnauthorizedException('No OIDC refresh token provided');
    }

    try {
      const tokens = await this.refreshTokens(refreshToken.trim());
      this.cookieService.setOidcSessionCookies(res, tokens);
    } catch (error) {
      this.cookieService.clearOidcSessionCookies(res);
      throw error;
    }
  }

  /**
   * RP-initiated logout: clear Byte Forge cookies, revoke IdP refresh token,
   * then return HTML that auto-submits to the IdP `end_session_endpoint`.
   *
   * Uses a form POST (not a 302 with query string) so long `id_token_hint`
   * values are not truncated in the Location header.
   */
  async completeFederatedLogout(req: Request, res: Response): Promise<string> {
    const idToken = (req.cookies?.bfIdToken as string | undefined)?.trim();
    const refreshToken = (req.cookies?.bfRefreshToken as string | undefined)?.trim();

    this.cookieService.clearOidcSessionCookies(res);
    this.cookieService.clearOidcPkceCookies(res);

    if (refreshToken) {
      await this.revokeRefreshToken(refreshToken);
    }

    const issuer = this.appConfig.oidcIssuer.replace(/\/$/, '');
    const endSessionEndpoint = `${issuer}/session/end`;
    const state = randomUUID();
    const postLogoutRedirectUri = this.appConfig.oidcPostLogoutRedirectUri;
    const clientId = this.appConfig.oidcClientId;

    const idTokenField = idToken
      ? `<input type="hidden" name="id_token_hint" value="${escapeHtmlAttr(idToken)}" />`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Signing out</title>
</head>
<body>
  <p>Signing you out…</p>
  <form id="bf-logout" method="get" action="${escapeHtmlAttr(endSessionEndpoint)}">
    <input type="hidden" name="client_id" value="${escapeHtmlAttr(clientId)}" />
    <input type="hidden" name="post_logout_redirect_uri" value="${escapeHtmlAttr(postLogoutRedirectUri)}" />
    <input type="hidden" name="state" value="${escapeHtmlAttr(state)}" />
    ${idTokenField}
  </form>
  <script>document.getElementById('bf-logout').submit();</script>
</body>
</html>`;
  }

  /** @deprecated Use completeFederatedLogout — kept for tests building URL params. */
  beginFederatedLogout(
    req: Request,
    res: Response,
    _returnTo?: string,
  ): string {
    const idToken = (req.cookies?.bfIdToken as string | undefined)?.trim();
    this.cookieService.clearOidcSessionCookies(res);
    this.cookieService.clearOidcPkceCookies(res);

    const postLogoutRedirectUri = this.appConfig.oidcPostLogoutRedirectUri;
    const issuer = this.appConfig.oidcIssuer.replace(/\/$/, '');
    const params = new URLSearchParams({
      client_id: this.appConfig.oidcClientId,
      post_logout_redirect_uri: postLogoutRedirectUri,
      state: randomUUID(),
    });

    if (idToken) {
      params.set('id_token_hint', idToken);
    }

    return `${issuer}/session/end?${params.toString()}`;
  }

  /** Clear BF OIDC cookies only; IdP session may remain (fast re-login). */
  endLocalSession(res: Response): void {
    this.cookieService.clearOidcSessionCookies(res);
    this.cookieService.clearOidcPkceCookies(res);
  }

  private buildAuthorizeUrl(verifier: string, state: string): string {
    const issuer = this.appConfig.oidcIssuer.replace(/\/$/, '');
    const challenge = generateCodeChallenge(verifier);
    const search = new URLSearchParams({
      client_id: this.appConfig.oidcClientId,
      redirect_uri: this.appConfig.oidcRedirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      nonce: randomUUID().replace(/-/g, ''),
    });

    search.set('resource', this.appConfig.oidcDefaultResource);

    return `${issuer}/auth?${search.toString()}`;
  }

  private async exchangeAuthorizationCode(
    code: string,
    verifier: string,
  ): Promise<OidcTokenResponse> {
    const issuer = this.appConfig.oidcInternalIssuer.replace(/\/$/, '');
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.appConfig.oidcClientId,
      redirect_uri: this.appConfig.oidcRedirectUri,
      code,
      code_verifier: verifier,
    });

    const response = await fetch(`${issuer}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new UnauthorizedException(
        `OIDC token exchange failed (${response.status}): ${errorBody}`,
      );
    }

    return (await response.json()) as OidcTokenResponse;
  }

  private async refreshTokens(refreshToken: string): Promise<OidcTokenResponse> {
    const issuer = this.appConfig.oidcInternalIssuer.replace(/\/$/, '');
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.appConfig.oidcClientId,
      refresh_token: refreshToken,
    });

    const response = await fetch(`${issuer}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new UnauthorizedException(
        `OIDC refresh failed (${response.status}): ${errorBody}`,
      );
    }

    return (await response.json()) as OidcTokenResponse;
  }

  private async revokeRefreshToken(refreshToken: string): Promise<void> {
    const issuer = this.appConfig.oidcInternalIssuer.replace(/\/$/, '');
    const body = new URLSearchParams({
      client_id: this.appConfig.oidcClientId,
      token: refreshToken,
      token_type_hint: 'refresh_token',
    });

    try {
      await fetch(`${issuer}/token/revocation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      // Best-effort; end_session still runs in the browser.
    }
  }

  private readPkceCookies(req: Request): {
    verifier?: string;
    state?: string;
    returnTo?: string;
  } {
    return {
      verifier: req.cookies?.bfOidcVerifier as string | undefined,
      state: req.cookies?.bfOidcState as string | undefined,
      returnTo: req.cookies?.bfOidcReturnTo as string | undefined,
    };
  }
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
