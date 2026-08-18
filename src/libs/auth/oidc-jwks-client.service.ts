import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { assertOidcAtHash } from '@/libs/auth/oidc/oidc-id-token-hash.util';

const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;
export const OIDC_JWT_ALGORITHMS = ['RS256'] as const;

@Injectable()
export class OidcJwksClientService {
  private cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private cacheExpiresAt = 0;

  constructor(private readonly appConfig: AppConfigService) {}

  get jwksUrl(): string {
    return new URL('/jwks', this.appConfig.oidcInternalIssuer).toString();
  }

  async verifyAccessToken(
    token: string,
    audience?: string,
  ): Promise<{
    payload: Awaited<ReturnType<typeof jwtVerify>>['payload'];
  }> {
    const expectedAudience = audience ?? this.appConfig.oidcDefaultResource;
    const { payload } = await this.verifySignedJwt(token, expectedAudience);
    return { payload };
  }

  async verifyIdToken(
    token: string,
    expectedNonce: string,
    accessToken: string,
  ): Promise<{
    payload: Awaited<ReturnType<typeof jwtVerify>>['payload'];
  }> {
    const { payload, protectedHeader } = await this.verifySignedJwt(
      token,
      this.appConfig.oidcClientId,
    );

    if (payload.nonce !== expectedNonce) {
      throw new UnauthorizedException('id_token nonce mismatch');
    }

    const azp = payload.azp;
    if (typeof azp === 'string' && azp !== this.appConfig.oidcClientId) {
      throw new UnauthorizedException('id_token azp mismatch');
    }

    const atHash = payload.at_hash;
    if (typeof atHash === 'string') {
      const alg =
        typeof protectedHeader.alg === 'string' ? protectedHeader.alg : 'RS256';
      assertOidcAtHash(accessToken, atHash, alg);
    }

    return { payload };
  }

  invalidateCache(): void {
    this.cachedJwks = null;
    this.cacheExpiresAt = 0;
  }

  private async verifySignedJwt(
    token: string,
    audience: string,
  ): Promise<Awaited<ReturnType<typeof jwtVerify>>> {
    const options = {
      issuer: this.appConfig.oidcIssuer,
      audience,
      algorithms: [...OIDC_JWT_ALGORITHMS],
    };

    try {
      return await jwtVerify(token, await this.getVerifier(), options);
    } catch (error) {
      if (this.shouldRetryAfterJwksRefresh(error)) {
        this.invalidateCache();
        return jwtVerify(token, await this.getVerifier(), options);
      }

      throw error;
    }
  }

  private async getVerifier(): Promise<ReturnType<typeof createRemoteJWKSet>> {
    if (this.cachedJwks && Date.now() < this.cacheExpiresAt) {
      return this.cachedJwks;
    }

    this.cachedJwks = createRemoteJWKSet(new URL(this.jwksUrl));
    this.cacheExpiresAt = Date.now() + DEFAULT_CACHE_TTL_MS;
    return this.cachedJwks;
  }

  private shouldRetryAfterJwksRefresh(error: unknown): boolean {
    return error instanceof errors.JWSSignatureVerificationFailed;
  }
}
