import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateOidcNonce,
  generateOidcState,
} from '@/libs/auth/oidc/oidc-pkce.util';
import {
  buildFrontendRedirect,
  safeReturnTo,
} from '@/libs/auth/oidc/oidc-return-to.util';
import { buildOidcLoginErrorUrl } from '@/libs/auth/oidc/oidc-callback-error.util';
import { buildOidcAccessTokenContext } from '@/libs/auth/oidc/build-oidc-access-token-context';
import { OidcJwksClientService } from '@/libs/auth/oidc-jwks-client.service';
import type { OidcTokenResponse } from '@/libs/auth/oidc/oidc-token.types';
import { CookieService } from '@/libs/modules/cookie/cookie.service';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { OidcIdentityProvisionerService } from './oidc-identity-provisioner.service';

const PKCE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

type OidcCallbackQuery = {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
};

@Injectable()
export class OidcAuthService {
  private readonly logger = new Logger(OidcAuthService.name);

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly cookieService: CookieService,
    private readonly jwksClient: OidcJwksClientService,
    private readonly oidcProvisioner: OidcIdentityProvisionerService,
  ) {}

  beginLogin(res: Response, returnTo?: string): string {
    const verifier = generateCodeVerifier();
    const state = generateOidcState();
    const nonce = generateOidcNonce();
    const authorizeUrl = this.buildAuthorizeUrl(verifier, state, nonce);

    this.cookieService.setOidcPkceCookies(res, {
      verifier,
      state,
      nonce,
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
      return buildOidcLoginErrorUrl(frontendUrl, query.error);
    }

    if (!query.code || !query.state) {
      this.cookieService.clearOidcPkceCookies(res);
      return buildOidcLoginErrorUrl(frontendUrl, 'failed');
    }

    const pkce = this.readPkceCookies(req);
    if (
      !pkce.verifier
      || !pkce.state
      || !pkce.nonce
      || pkce.state !== query.state
    ) {
      this.cookieService.clearOidcPkceCookies(res);
      return buildOidcLoginErrorUrl(frontendUrl, 'failed');
    }

    try {
      const tokens = await this.exchangeAuthorizationCode(
        query.code,
        pkce.verifier,
      );

      if (!tokens.id_token?.trim()) {
        this.cookieService.clearOidcPkceCookies(res);
        this.cookieService.clearOidcSessionCookies(res);
        return buildOidcLoginErrorUrl(frontendUrl, 'token_exchange_failed');
      }

      await this.jwksClient.verifyIdToken(
        tokens.id_token,
        pkce.nonce,
        tokens.access_token,
      );

      try {
        await this.provisionIdentityFromAccessToken(tokens.access_token);
      } catch {
        this.cookieService.clearOidcPkceCookies(res);
        return buildOidcLoginErrorUrl(frontendUrl, 'provision_failed');
      }

      this.cookieService.setOidcSessionCookies(res, tokens);
      this.cookieService.clearOidcPkceCookies(res);

      return buildFrontendRedirect(frontendUrl, pkce.returnTo);
    } catch {
      this.cookieService.clearOidcPkceCookies(res);
      this.cookieService.clearOidcSessionCookies(res);
      return buildOidcLoginErrorUrl(frontendUrl, 'token_exchange_failed');
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
   * GET with `client_id` + `post_logout_redirect_uri` only. `id_token_hint` is
   * omitted so the JWT never lands in the query string (browser history, logs).
   * The IdP session cookie identifies the user when present.
   */
  async completeFederatedLogout(req: Request, res: Response): Promise<string> {
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
  </form>
  <script>document.getElementById('bf-logout').submit();</script>
</body>
</html>`;
  }

  /** @deprecated Use completeFederatedLogout — kept for tests building URL params. */
  beginFederatedLogout(
    _req: Request,
    res: Response,
    _returnTo?: string,
  ): string {
    this.cookieService.clearOidcSessionCookies(res);
    this.cookieService.clearOidcPkceCookies(res);

    const postLogoutRedirectUri = this.appConfig.oidcPostLogoutRedirectUri;
    const issuer = this.appConfig.oidcIssuer.replace(/\/$/, '');
    const params = new URLSearchParams({
      client_id: this.appConfig.oidcClientId,
      post_logout_redirect_uri: postLogoutRedirectUri,
      state: randomUUID(),
    });

    return `${issuer}/session/end?${params.toString()}`;
  }

  /** Clear BF OIDC cookies only; IdP session may remain (fast re-login). */
  endLocalSession(res: Response): void {
    this.cookieService.clearOidcSessionCookies(res);
    this.cookieService.clearOidcPkceCookies(res);
  }

  private async provisionIdentityFromAccessToken(
    accessToken: string,
  ): Promise<void> {
    const { payload } = await this.jwksClient.verifyAccessToken(accessToken);
    const context = buildOidcAccessTokenContext(payload, {
      issuer: this.appConfig.oidcIssuer,
      audience: this.appConfig.oidcDefaultResource,
    });
    await this.oidcProvisioner.provisionFromToken(context);
  }

  private buildAuthorizeUrl(
    verifier: string,
    state: string,
    nonce: string,
  ): string {
    const issuer = this.appConfig.oidcIssuer.replace(/\/$/, '');
    const challenge = generateCodeChallenge(verifier);
    const search = new URLSearchParams({
      client_id: this.appConfig.oidcClientId,
      redirect_uri: this.appConfig.oidcRedirectUri,
      response_type: 'code',
      scope: 'openid profile email offline_access',
      prompt: 'consent',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      nonce,
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

    const response = await this.oidcFetch(`${issuer}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.warn(
        `OIDC token exchange failed (${response.status}): ${errorBody.slice(0, 500)}`,
      );
      throw new UnauthorizedException('OIDC token exchange failed');
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

    const response = await this.oidcFetch(`${issuer}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.warn(
        `OIDC refresh failed (${response.status}): ${errorBody.slice(0, 500)}`,
      );
      throw new UnauthorizedException('OIDC refresh failed');
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
      await this.oidcFetch(`${issuer}/token/revocation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch (error) {
      this.logger.warn(
        'OIDC refresh token revocation failed; continuing end_session',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  private async oidcFetch(
    url: string,
    init: RequestInit,
  ): Promise<globalThis.Response> {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(this.appConfig.oidcHttpTimeoutMs),
      });
    } catch (error) {
      if (isAbortOrTimeout(error)) {
        throw new UnauthorizedException('OIDC identity provider timed out');
      }
      throw error;
    }
  }

  private readPkceCookies(req: Request): {
    verifier?: string;
    state?: string;
    nonce?: string;
    returnTo?: string;
  } {
    return {
      verifier: req.cookies?.bfOidcVerifier as string | undefined,
      state: req.cookies?.bfOidcState as string | undefined,
      nonce: req.cookies?.bfOidcNonce as string | undefined,
      returnTo: req.cookies?.bfOidcReturnTo as string | undefined,
    };
  }
}

function isAbortOrTimeout(error: unknown): boolean {
  return (
    error instanceof Error
    && (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
