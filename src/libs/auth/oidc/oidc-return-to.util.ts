const BLOCKED_RETURN_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-reset',
  '/verify-account',
] as const;

function isBlockedReturnPath(pathname: string): boolean {
  return BLOCKED_RETURN_PATHS.some(
    (blocked) => pathname === blocked || pathname.startsWith(`${blocked}/`),
  );
}

function hasControlChars(value: string): boolean {
  return /[\u0000-\u001f\u007f]/.test(value);
}

/**
 * Decode then validate an in-app path. Rejects protocol-relative URLs,
 * backslashes, leftover encodings, and auth-page blocklist prefixes.
 */
export function normalizeReturnToPath(raw: string): string | null {
  let current = raw.trim();
  if (!current || hasControlChars(current)) return null;

  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(current.replace(/\+/g, ' '));
      if (decoded === current) break;
      current = decoded;
      if (hasControlChars(current)) return null;
    } catch {
      return null;
    }
  }

  if (current.includes('\\') || /%2f/i.test(current) || current.includes('%')) {
    return null;
  }

  const pathname = current.split('?')[0] ?? current;
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return null;
  if (pathname.includes('//')) return null;
  if (isBlockedReturnPath(pathname)) return null;

  return current;
}

export function safeReturnTo(
  value: string | string[] | undefined | null,
  fallback = '/',
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || !raw) return fallback;
  return normalizeReturnToPath(raw) ?? fallback;
}

export function buildFrontendRedirect(
  frontendUrl: string,
  returnTo: string | string[] | undefined | null,
): string {
  const base = frontendUrl.replace(/\/$/, '');
  const path = safeReturnTo(returnTo);
  return `${base}${path}`;
}
