import { JWTPayload } from 'jose';

/**
 * Verified OIDC access token claims attached by JwtResourceGuard.
 */
export type OidcAccessTokenContext = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  aud: string | string[];
  iss: string;
  claims: JWTPayload;
};

export type RequestWithOidcAccessToken = {
  oidcAccessToken?: OidcAccessTokenContext;
};
