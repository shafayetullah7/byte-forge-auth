import type { Request, Response } from 'express';
import { OidcAuthService } from './oidc-auth.service';
import { CookieService } from '@/libs/modules/cookie/cookie.service';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';

describe('OidcAuthService federated logout', () => {
  const cookieService = {
    clearOidcSessionCookies: jest.fn(),
    clearOidcPkceCookies: jest.fn(),
    setOidcPkceCookies: jest.fn(),
  };

  const appConfig = {
    oidcIssuer: 'http://localhost:3010',
    oidcInternalIssuer: 'http://localhost:3010',
    oidcClientId: 'byte-forge-web',
    oidcRedirectUri: 'http://localhost:3005/api/v1/user/auth/oidc/callback',
    oidcDefaultResource: 'http://localhost:3005',
    oidcPostLogoutRedirectUri: 'http://localhost:3000/',
    frontendUrl: 'http://localhost:3000',
  };

  let service: OidcAuthService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    service = new OidcAuthService(
      appConfig as unknown as AppConfigService,
      cookieService as unknown as CookieService,
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns auto-submit HTML with id_token_hint and clears local cookies', async () => {
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
    expect(html).toContain('name="id_token_hint" value="id-token.jwt"');
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
    expect(parsed.searchParams.get('id_token_hint')).toBe('id-token.jwt');
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
