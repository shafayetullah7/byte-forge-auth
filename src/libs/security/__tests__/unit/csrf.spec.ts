import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import {
  assertUserCsrfToken,
  isCsrfExemptPath,
  USER_XSRF_COOKIE,
  USER_XSRF_HEADER,
} from '../../csrf';

function mockRequest(
  overrides: Partial<Request> & {
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
  } = {},
): Request {
  return {
    method: 'POST',
    path: '/api/v1/user/auth/logout',
    cookies: {},
    headers: {},
    ...overrides,
  } as Request;
}

describe('isCsrfExemptPath', () => {
  it('exempts health checks only', () => {
    expect(isCsrfExemptPath('/health')).toBe(true);
    expect(isCsrfExemptPath('/api/v1/user/auth/logout')).toBe(false);
  });
});

describe('assertUserCsrfToken', () => {
  const allowedOrigins = ['http://localhost:3000'];

  it('allows GET without CSRF token', () => {
    expect(() =>
      assertUserCsrfToken(
        mockRequest({ method: 'GET', path: '/api/v1/user/auth/oidc-check' }),
        allowedOrigins,
      ),
    ).not.toThrow();
  });

  it('passes when cookie and header match', () => {
    expect(() =>
      assertUserCsrfToken(
        mockRequest({
          cookies: { [USER_XSRF_COOKIE]: 'token-123' },
          headers: { [USER_XSRF_HEADER]: 'token-123' },
        }),
        allowedOrigins,
      ),
    ).not.toThrow();
  });

  it('throws when cookie is missing', () => {
    expect(() =>
      assertUserCsrfToken(
        mockRequest({
          cookies: {},
          headers: { [USER_XSRF_HEADER]: 'token-123' },
        }),
        allowedOrigins,
      ),
    ).toThrow(ForbiddenException);
  });

  it('throws when header is missing', () => {
    expect(() =>
      assertUserCsrfToken(
        mockRequest({
          cookies: { [USER_XSRF_COOKIE]: 'token-123' },
          headers: {},
        }),
        allowedOrigins,
      ),
    ).toThrow(ForbiddenException);
  });

  it('throws when cookie and header mismatch', () => {
    expect(() =>
      assertUserCsrfToken(
        mockRequest({
          cookies: { [USER_XSRF_COOKIE]: 'token-a' },
          headers: { [USER_XSRF_HEADER]: 'token-b' },
        }),
        allowedOrigins,
      ),
    ).toThrow(ForbiddenException);
  });

  it('passes when cookie matches form body xsrf', () => {
    expect(() =>
      assertUserCsrfToken(
        mockRequest({
          cookies: { [USER_XSRF_COOKIE]: 'token-123' },
          headers: {},
          body: { xsrf: 'token-123' },
        } as Partial<Request> & {
          cookies?: Record<string, string>;
          headers?: Record<string, string>;
          body?: Record<string, string>;
        }),
        allowedOrigins,
      ),
    ).not.toThrow();
  });
});
