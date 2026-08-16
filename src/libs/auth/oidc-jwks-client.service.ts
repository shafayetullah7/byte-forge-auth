import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';

const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class OidcJwksClientService {
  private cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private cacheExpiresAt = 0;

  constructor(private readonly appConfig: AppConfigService) {}

  get jwksUrl(): string {
    return new URL('/jwks', this.appConfig.oidcIssuer).toString();
  }

  async verifyAccessToken(
    token: string,
    audience?: string,
  ): Promise<{
    payload: Awaited<ReturnType<typeof jwtVerify>>['payload'];
  }> {
    const expectedAudience = audience ?? this.appConfig.oidcDefaultResource;

    try {
      return await jwtVerify(token, await this.getVerifier(), {
        issuer: this.appConfig.oidcIssuer,
        audience: expectedAudience,
      });
    } catch (error) {
      if (this.shouldRetryAfterJwksRefresh(error)) {
        this.invalidateCache();
        return jwtVerify(token, await this.getVerifier(), {
          issuer: this.appConfig.oidcIssuer,
          audience: expectedAudience,
        });
      }

      throw error;
    }
  }

  invalidateCache(): void {
    this.cachedJwks = null;
    this.cacheExpiresAt = 0;
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
