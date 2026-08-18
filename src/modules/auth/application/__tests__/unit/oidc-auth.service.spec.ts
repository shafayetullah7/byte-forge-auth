import type { Request, Response } from 'express';
import { OidcAuthService } from '../../oidc-auth.service';
import { CookieService } from '@/libs/modules/cookie/cookie.service';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { OidcJwksClientService } from '@/libs/auth/oidc-jwks-client.service';
import { OidcIdentityProvisionerService } from '../../oidc-identity-provisioner.service';

describe('OidcAuthService', () => {
  const cookieService = {
    clearOidcSessionCookies: jest.fn(),
    clearOidcPkceCookies: jest.fn(),
    setOidcPkceCookies: jest.fn(),
    setOidcSessionCookies: jest.fn(),
  };

  const appConfig = {
    oidcIssuer: 'http://localhost:3010',
    oidcInternalIssuer: 'http://localhost:3010',
    oidcClientId: 'byte-forge-web',
    oidcRedirectUri: 'http://localhost:3005/api/v1/user/auth/oidc/callback',
    oidcDefaultResource: 'http://localhost:3005',
    oidcPostLogoutRedirectUri: 'http://localhost:3000/',
    oidcHttpTimeoutMs: 10_000,
    frontendUrl: 'http://localhost:3000',
  };

  const jwksClient = {
    verifyAccessToken: jest.fn(),
    verifyIdToken: jest.fn(),
  };

  const oidcProvisioner = {
    provisionFromToken: jest.fn(),
    resolveFromToken: jest.fn(),
  };

  let service: OidcAuthService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    jwksClient.verifyIdToken.mockResolvedValue({ payload: { nonce: 'nonce-1' } });
    service = new OidcAuthService(
      appConfig as unknown as AppConfigService,
      cookieService as unknown as CookieService,
      jwksClient as unknown as OidcJwksClientService,
      oidcProvisioner as unknown as OidcIdentityProvisionerService,
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('beginLogin', () => {
    it('stores nonce in PKCE cookies and puts it on the authorize URL', () => {
      const res = {} as Response;
      const url = service.beginLogin(res, '/shop');
      const parsed = new URL(url);

      expect(parsed.searchParams.get('nonce')).toBeTruthy();
      expect(cookieService.setOidcPkceCookies).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          nonce: parsed.searchParams.get('nonce'),
          returnTo: '/shop',
        }),
      );
    });
  });

  describe('completeCallback', () => {
    const req = {
      cookies: {
        bfOidcVerifier: 'verifier',
        bfOidcState: 'state-1',
        bfOidcNonce: 'nonce-1',
        bfOidcReturnTo: '/shop',
      },
    } as unknown as Request;
    const res = {} as Response;

    it('provisions identity before setting session cookies', async () => {
      const callOrder: string[] = [];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          id_token: 'id-token',
        }),
      });
      jwksClient.verifyAccessToken.mockResolvedValue({
        payload: {
          sub: 'user-sub',
          email: 'buyer@example.com',
          email_verified: true,
        },
      });
      oidcProvisioner.provisionFromToken.mockImplementation(async () => {
        callOrder.push('provision');
      });
      cookieService.setOidcSessionCookies.mockImplementation(() => {
        callOrder.push('cookies');
      });

      const redirectUrl = await service.completeCallback(req, res, {
        code: 'auth-code',
        state: 'state-1',
      });

      expect(redirectUrl).toBe('http://localhost:3000/shop');
      expect(callOrder).toEqual(['provision', 'cookies']);
      expect(oidcProvisioner.provisionFromToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-sub',
          email: 'buyer@example.com',
        }),
      );
      expect(jwksClient.verifyIdToken).toHaveBeenCalledWith(
        'id-token',
        'nonce-1',
        'access-token',
      );
      expect(cookieService.setOidcSessionCookies).toHaveBeenCalledWith(res, {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        id_token: 'id-token',
      });
    });

    it('returns login error URL without setting cookies when provision fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          id_token: 'id-token',
        }),
      });
      jwksClient.verifyAccessToken.mockResolvedValue({
        payload: {
          sub: 'user-sub',
          email: 'buyer@example.com',
          email_verified: true,
        },
      });
      oidcProvisioner.provisionFromToken.mockRejectedValue(
        new Error('provision failed'),
      );

      const redirectUrl = await service.completeCallback(req, res, {
        code: 'auth-code',
        state: 'state-1',
      });

      expect(redirectUrl).toBe(
        'http://localhost:3000/login?oidc_error=provision_failed',
      );
      expect(cookieService.setOidcSessionCookies).not.toHaveBeenCalled();
      expect(cookieService.clearOidcPkceCookies).toHaveBeenCalledWith(res);
    });

    it('maps IdP error to a closed code and does not echo raw strings', async () => {
      const redirectUrl = await service.completeCallback(req, res, {
        error: 'server_error<script>',
      });

      expect(redirectUrl).toBe(
        'http://localhost:3000/login?oidc_error=failed',
      );
      expect(cookieService.clearOidcPkceCookies).toHaveBeenCalledWith(res);
      expect(cookieService.setOidcSessionCookies).not.toHaveBeenCalled();
    });

    it('keeps known IdP error codes', async () => {
      const redirectUrl = await service.completeCallback(req, res, {
        error: 'access_denied',
      });

      expect(redirectUrl).toBe(
        'http://localhost:3000/login?oidc_error=access_denied',
      );
    });

    it('redirects token exchange failures instead of throwing JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'invalid_grant internals',
      });

      const redirectUrl = await service.completeCallback(req, res, {
        code: 'auth-code',
        state: 'state-1',
      });

      expect(redirectUrl).toBe(
        'http://localhost:3000/login?oidc_error=token_exchange_failed',
      );
      expect(cookieService.setOidcSessionCookies).not.toHaveBeenCalled();
      expect(cookieService.clearOidcSessionCookies).toHaveBeenCalledWith(res);
    });

    it('redirects when id_token is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        }),
      });

      const redirectUrl = await service.completeCallback(req, res, {
        code: 'auth-code',
        state: 'state-1',
      });

      expect(redirectUrl).toBe(
        'http://localhost:3000/login?oidc_error=token_exchange_failed',
      );
      expect(jwksClient.verifyIdToken).not.toHaveBeenCalled();
      expect(cookieService.setOidcSessionCookies).not.toHaveBeenCalled();
    });

    it('redirects when id_token verification fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          id_token: 'id-token',
        }),
      });
      jwksClient.verifyIdToken.mockRejectedValue(new Error('nonce mismatch'));

      const redirectUrl = await service.completeCallback(req, res, {
        code: 'auth-code',
        state: 'state-1',
      });

      expect(redirectUrl).toBe(
        'http://localhost:3000/login?oidc_error=token_exchange_failed',
      );
      expect(cookieService.setOidcSessionCookies).not.toHaveBeenCalled();
    });

    it('redirects when the IdP request times out', async () => {
      const timeout = new Error('The operation was aborted');
      timeout.name = 'TimeoutError';
      (global.fetch as jest.Mock).mockRejectedValue(timeout);

      const redirectUrl = await service.completeCallback(req, res, {
        code: 'auth-code',
        state: 'state-1',
      });

      expect(redirectUrl).toBe(
        'http://localhost:3000/login?oidc_error=token_exchange_failed',
      );
      expect(cookieService.setOidcSessionCookies).not.toHaveBeenCalled();
    });
  });

  describe('federated logout', () => {
    it('returns auto-submit HTML without id_token_hint and clears local cookies', async () => {
      const req = {
        cookies: {
          bfIdToken: 'id-token.jwt',
          bfRefreshToken: 'refresh-token',
        },
      } as unknown as Request;
      const res = {} as Response;

      const html = await service.completeFederatedLogout(req, res);

      expect(cookieService.clearOidcSessionCookies).toHaveBeenCalledWith(res);
      expect(cookieService.clearOidcPkceCookies).toHaveBeenCalledWith(res);
      expect(html).toContain('action="http://localhost:3010/session/end"');
      expect(html).not.toContain('id_token_hint');
      expect(html).not.toContain('id-token.jwt');
      expect(html).toContain('name="client_id" value="byte-forge-web"');
      expect(html).toContain(
        'name="post_logout_redirect_uri" value="http://localhost:3000/"',
      );
      expect(html).toContain('document.getElementById(\'bf-logout\').submit()');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3010/token/revocation',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('omits id_token_hint field when cookie is absent', async () => {
      const req = { cookies: {} } as unknown as Request;
      const res = {} as Response;

      const html = await service.completeFederatedLogout(req, res);

      expect(html).not.toContain('id_token_hint');
      expect(html).toContain('name="client_id" value="byte-forge-web"');
    });

    it('beginFederatedLogout builds URL with client_id for legacy callers', () => {
      const req = {
        cookies: { bfIdToken: 'id-token.jwt' },
      } as unknown as Request;
      const res = {} as Response;

      const url = service.beginFederatedLogout(req, res);

      expect(cookieService.clearOidcSessionCookies).toHaveBeenCalledWith(res);
      const parsed = new URL(url);
      expect(parsed.searchParams.get('id_token_hint')).toBeNull();
      expect(parsed.searchParams.get('client_id')).toBe('byte-forge-web');
      expect(parsed.searchParams.get('post_logout_redirect_uri')).toBe(
        'http://localhost:3000/',
      );
    });

    it('endLocalSession clears OIDC cookies without building redirect', () => {
      const res = {} as Response;
      service.endLocalSession(res);
      expect(cookieService.clearOidcSessionCookies).toHaveBeenCalledWith(res);
      expect(cookieService.clearOidcPkceCookies).toHaveBeenCalledWith(res);
    });
  });
});
