import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

export const USER_XSRF_COOKIE = 'bf-xsrf-token';
export const USER_XSRF_HEADER = 'x-xsrf-token';

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

const CSRF_EXEMPT_PATH_PREFIXES = ['/health'];

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
  const xsrfSubmitted = readSubmittedCsrfToken(request);

  if (!xsrfCookie || !xsrfSubmitted || xsrfCookie !== xsrfSubmitted) {
    throw new ForbiddenException('Invalid CSRF token');
  }
}

/** Header (fetch) or form field (top-level POST, e.g. federated logout). */
function readSubmittedCsrfToken(request: Request): string | undefined {
  const header = request.headers[USER_XSRF_HEADER];
  if (typeof header === 'string' && header) {
    return header;
  }

  const body = request.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const fromBody = body.xsrf ?? body._csrf;
  return typeof fromBody === 'string' && fromBody ? fromBody : undefined;
}
