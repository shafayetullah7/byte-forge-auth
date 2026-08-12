import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

export const USER_XSRF_COOKIE = 'userXsrfToken';
export const USER_XSRF_HEADER = 'x-xsrf-token';

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

const CSRF_EXEMPT_PATH_PREFIXES = [
  '/api/v1/user/auth/login',
  '/api/v1/user/auth/register',
  '/api/v1/user/password-reset',
  '/health',
];

export function isCsrfExemptPath(path: string): boolean {
  return CSRF_EXEMPT_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/$/, '');
  }
}

export function assertAllowedOrigin(
  request: Request,
  allowedOrigins: string[],
): void {
  const origin = request.headers.origin;
  const referer = request.headers.referer;

  if (!origin && !referer) {
    return;
  }

  const normalizedAllowed = allowedOrigins.map(normalizeOrigin);

  if (origin) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedAllowed.includes(normalizedOrigin)) {
      throw new ForbiddenException('Invalid request origin');
    }
    return;
  }

  if (referer) {
    const refererOrigin = normalizeOrigin(referer);
    if (!normalizedAllowed.includes(refererOrigin)) {
      throw new ForbiddenException('Invalid request origin');
    }
  }
}

export function assertUserCsrfToken(
  request: Request,
  allowedOrigins: string[] = [],
): void {
  const method = request.method.toUpperCase();
  if (!STATE_CHANGING_METHODS.includes(method)) {
    return;
  }

  const path = request.path;
  if (isCsrfExemptPath(path)) {
    return;
  }

  if (allowedOrigins.length > 0) {
    assertAllowedOrigin(request, allowedOrigins);
  }

  const xsrfCookie = request.cookies?.[USER_XSRF_COOKIE] as string | undefined;
  const xsrfHeader = request.headers[USER_XSRF_HEADER] as string | undefined;

  if (!xsrfCookie || !xsrfHeader || xsrfCookie !== xsrfHeader) {
    throw new ForbiddenException('Invalid CSRF token');
  }
}
