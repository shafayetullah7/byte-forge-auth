import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserAuthV2Service } from '@/modules/auth/application/user-auth-v2.service';
import { CookieService } from '@/libs/modules/cookie/cookie.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { AccessUserAuth } from '@/libs/types';
import { assertUserCsrfToken } from '@/libs/security/csrf';
import * as crypto from 'crypto';

interface JwtPayload {
  sessionId: string;
  exp: number;
}

type RequestWithUser = Request & { user?: AccessUserAuth };

@Injectable()
export class UserAuthJWtGuard implements CanActivate {
  constructor(
    private readonly userAuthV2Service: UserAuthV2Service,
    private readonly cookieService: CookieService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();

    assertUserCsrfToken(request, this.configService.allowedOrigins);

    const accessToken = request.cookies?.userAccessToken as string | undefined;

    if (!accessToken) {
      // Try to refresh if refresh token is available
      const refreshToken = request.cookies?.userRefreshToken as
        | string
        | undefined;
      if (refreshToken) {
        try {
          const { tokens, user, session } =
            await this.userAuthV2Service.refreshTokens(refreshToken);

          // Set new tokens in response
          this.cookieService.setUserAccessToken(response, tokens.accessToken);
          this.cookieService.setUserRefreshToken(response, tokens.refreshToken);

          // Rotate XSRF Token
          const xsrfToken = crypto.randomUUID();
          this.cookieService.setUserXsrfToken(response, xsrfToken);

          // Attach user info to request
          request.user = {
            user,
            session: { id: session.id },
          } as AccessUserAuth;

          return true;
        } catch {
          // If refresh fails, clear tokens and throw unauthorized
          this.cookieService.clearUserTokens(response);
          throw new UnauthorizedException(
            'Session expired. Please log in again.',
          );
        }
      }

      throw new UnauthorizedException('Unauthorized access - no valid tokens');
    }

    try {
      // Verify the access token
      const verifiedPayload: unknown = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret: this.configService.jwtUserAccessSecret,
        },
      );
      const payload = verifiedPayload as JwtPayload;

      // If token is valid, check if it's close to expiration and refresh if needed
      const tokenExpiration = payload.exp * 1000; // Convert to milliseconds
      const timeUntilExpiration = tokenExpiration - Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      // If token expires in less than 5 minutes, refresh it silently
      if (timeUntilExpiration < fiveMinutes) {
        const refreshToken = request.cookies?.userRefreshToken as
          | string
          | undefined;
        if (refreshToken) {
          try {
            const { tokens, user, session } =
              await this.userAuthV2Service.refreshTokens(refreshToken);

            // Set new tokens in response
            this.cookieService.setUserAccessToken(response, tokens.accessToken);
            this.cookieService.setUserRefreshToken(
              response,
              tokens.refreshToken,
            );

            // Rotate XSRF Token
            const xsrfToken = crypto.randomUUID();
            this.cookieService.setUserXsrfToken(response, xsrfToken);

            // Attach user info to request
            request.user = { user, session };

            return true;
          } catch {
            // If refresh fails, clear tokens and throw unauthorized
            this.cookieService.clearUserTokens(response);
            throw new UnauthorizedException(
              'Session expired. Please log in again.',
            );
          }
        }
      }

      // Token is valid and not close to expiration, attach user info to request
      // We need to get user details from the session
      const userSession = await this.userAuthV2Service.getUserSessionById(
        payload.sessionId,
      );
      if (!userSession) {
        throw new UnauthorizedException('Session not found');
      }

      request.user = {
        user: userSession.user,
        session: userSession.session,
      };

      return true;
    } catch {
      // If access token is invalid, try to refresh
      const refreshToken = request.cookies?.userRefreshToken as
        | string
        | undefined;
      if (refreshToken) {
        try {
          const { tokens, user, session } =
            await this.userAuthV2Service.refreshTokens(refreshToken);

          // Set new tokens in response
          this.cookieService.setUserAccessToken(response, tokens.accessToken);
          this.cookieService.setUserRefreshToken(response, tokens.refreshToken);

          // Rotate XSRF Token
          const xsrfToken = crypto.randomUUID();
          this.cookieService.setUserXsrfToken(response, xsrfToken);

          // Attach user info to request
          request.user = { user, session };

          return true;
        } catch {
          // If refresh fails, clear tokens and throw unauthorized
          this.cookieService.clearUserTokens(response);
          throw new UnauthorizedException(
            'Session expired. Please log in again.',
          );
        }
      }

      throw new UnauthorizedException('Unauthorized access - invalid token');
    }
  }
}
