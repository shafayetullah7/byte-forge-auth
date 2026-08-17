import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { OidcJwksClientService } from '@/libs/auth/oidc-jwks-client.service';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import {
  OidcAccessTokenContext,
  RequestWithOidcAccessToken,
} from '@/libs/types/oidc-access-token.type';

export const BF_ACCESS_TOKEN_COOKIE = 'bfAccessToken';

function extractBearerToken(
  request: Request,
  cookieNames: string[] = [BF_ACCESS_TOKEN_COOKIE],
): string | null {
  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    if (token.length > 0) {
      return token;
    }
  }

  for (const name of cookieNames) {
    const cookieToken = request.cookies?.[name] as string | undefined;
    if (cookieToken?.trim()) {
      return cookieToken.trim();
    }
  }

  return null;
}

@Injectable()
export class JwtResourceGuard implements CanActivate {
  constructor(
    private readonly jwksClient: OidcJwksClientService,
    private readonly appConfig: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & RequestWithOidcAccessToken>();

    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Bearer token required');
    }

    try {
      const { payload } = await this.jwksClient.verifyAccessToken(token);

      if (!payload.sub || typeof payload.sub !== 'string') {
        throw new UnauthorizedException('Invalid access token');
      }

      const contextToken: OidcAccessTokenContext = {
        sub: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        email_verified:
          typeof payload.email_verified === 'boolean'
            ? payload.email_verified
            : undefined,
        aud: payload.aud ?? this.appConfig.oidcDefaultResource,
        iss:
          typeof payload.iss === 'string'
            ? payload.iss
            : this.appConfig.oidcIssuer,
        claims: payload,
      };

      request.oidcAccessToken = contextToken;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
