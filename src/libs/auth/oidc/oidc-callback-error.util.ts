export const OIDC_CALLBACK_ERROR_CODES = [
  'access_denied',
  'login_required',
  'temporarily_unavailable',
  'provision_failed',
  'token_exchange_failed',
  'failed',
] as const;

export type OidcCallbackErrorCode = (typeof OIDC_CALLBACK_ERROR_CODES)[number];

const ALLOWED = new Set<string>(OIDC_CALLBACK_ERROR_CODES);

/**
 * Map an IdP `error` query value to a closed set shown on the storefront.
 * Unknown or empty values become `failed` so we never echo raw IdP strings.
 */
export function mapOidcCallbackError(
  error: string | undefined | null,
): OidcCallbackErrorCode {
  const raw = error?.trim();
  if (raw && ALLOWED.has(raw)) {
    return raw as OidcCallbackErrorCode;
  }
  return 'failed';
}

export function buildOidcLoginErrorUrl(
  frontendUrl: string,
  error: string | undefined | null,
): string {
  const code = mapOidcCallbackError(error);
  return `${frontendUrl.replace(/\/$/, '')}/login?oidc_error=${encodeURIComponent(code)}`;
}
