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

export function safeReturnTo(
  value: string | string[] | undefined | null,
  fallback = '/',
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || !raw) return fallback;

  const pathname = raw.split('?')[0] ?? raw;
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return fallback;
  if (isBlockedReturnPath(pathname)) return fallback;

  return raw;
}

export function buildFrontendRedirect(
  frontendUrl: string,
  returnTo: string | string[] | undefined | null,
): string {
  const base = frontendUrl.replace(/\/$/, '');
  const path = safeReturnTo(returnTo);
  return `${base}${path}`;
}
