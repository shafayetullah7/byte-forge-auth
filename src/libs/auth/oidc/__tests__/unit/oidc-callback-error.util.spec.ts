import {
  buildOidcLoginErrorUrl,
  mapOidcCallbackError,
} from '../../oidc-callback-error.util';

describe('oidc-callback-error.util', () => {
  it('keeps known IdP and BFF error codes', () => {
    expect(mapOidcCallbackError('access_denied')).toBe('access_denied');
    expect(mapOidcCallbackError('login_required')).toBe('login_required');
    expect(mapOidcCallbackError('temporarily_unavailable')).toBe(
      'temporarily_unavailable',
    );
    expect(mapOidcCallbackError('provision_failed')).toBe('provision_failed');
    expect(mapOidcCallbackError('token_exchange_failed')).toBe(
      'token_exchange_failed',
    );
    expect(mapOidcCallbackError('failed')).toBe('failed');
  });

  it('maps unknown or empty values to failed', () => {
    expect(mapOidcCallbackError('server_error')).toBe('failed');
    expect(mapOidcCallbackError('<script>')).toBe('failed');
    expect(mapOidcCallbackError('')).toBe('failed');
    expect(mapOidcCallbackError(undefined)).toBe('failed');
  });

  it('builds a login error URL without echoing raw IdP errors', () => {
    expect(
      buildOidcLoginErrorUrl('http://localhost:3000/', 'access_denied'),
    ).toBe('http://localhost:3000/login?oidc_error=access_denied');
    expect(
      buildOidcLoginErrorUrl('http://localhost:3000', 'not-a-real-error'),
    ).toBe('http://localhost:3000/login?oidc_error=failed');
  });
});
