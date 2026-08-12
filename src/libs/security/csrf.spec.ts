import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import {
  assertUserCsrfToken,
  isCsrfExemptPath,
  USER_XSRF_COOKIE,
  USER_XSRF_HEADER,
} from './csrf';

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
  it('exempts login and register', () => {
    expect(isCsrfExemptPath('/api/v1/user/auth/login')).toBe(true);
    expect(isCsrfExemptPath('/api/v1/user/auth/register')).toBe(true);
  });

  it('exempts password reset routes', () => {
    expect(isCsrfExemptPath('/api/v1/user/password-reset/forgot')).toBe(true);
    expect(isCsrfExemptPath('/api/v1/user/password-reset/reset')).toBe(true);
  });

  it('does not exempt protected routes', () => {
    expect(isCsrfExemptPath('/api/v1/user/auth/logout')).toBe(false);
  });
});

describe('assertUserCsrfToken', () => {
  const allowedOrigins = ['http://localhost:3000'];

  it('allows GET without CSRF token', () => {
    expect(() =>
      assertUserCsrfToken(
        mockRequest({ method: 'GET', path: '/api/v1/user/auth/check' }),
        allowedOrigins,
      ),
    ).not.toThrow();
  });

  it('skips CSRF on exempt paths', () => {
    expect(() =>
      assertUserCsrfToken(
        mockRequest({
          method: 'POST',
          path: '/api/v1/user/auth/login',
          cookies: {},
          headers: {},
        }),
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

  it('rejects invalid origin when provided', () => {
    expect(() =>
      assertUserCsrfToken(
        mockRequest({
          cookies: { [USER_XSRF_COOKIE]: 'token-123' },
          headers: {
            [USER_XSRF_HEADER]: 'token-123',
            origin: 'https://evil.example',
          },
        }),
        allowedOrigins,
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows matching origin', () => {
    expect(() =>
      assertUserCsrfToken(
        mockRequest({
          cookies: { [USER_XSRF_COOKIE]: 'token-123' },
          headers: {
            [USER_XSRF_HEADER]: 'token-123',
            origin: 'http://localhost:3000',
          },
        }),
        allowedOrigins,
      ),
    ).not.toThrow();
  });
});
