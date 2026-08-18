import type { JWTPayload } from 'jose';
import { OidcAccessTokenContext } from '@/libs/types/oidc-access-token.type';

export function buildOidcAccessTokenContext(
  payload: JWTPayload,
  defaults: { issuer: string; audience: string },
): OidcAccessTokenContext {
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Access token missing sub claim');
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    email_verified:
      typeof payload.email_verified === 'boolean'
        ? payload.email_verified
        : undefined,
    aud: payload.aud ?? defaults.audience,
    iss: typeof payload.iss === 'string' ? payload.iss : defaults.issuer,
    claims: payload,
  };
}
