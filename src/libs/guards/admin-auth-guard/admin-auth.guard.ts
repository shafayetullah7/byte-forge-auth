import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminSessionService } from '@/modules/auth/application/admin-session.service';
import { AdminAuthService } from '@/modules/auth/application/admin-auth.service';
import { AccessAdminAuth } from '@/libs/types';
import { SessionRepository } from '@/modules/auth/repositories/session.repository';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { CookieService } from '@/libs/modules/cookie/cookie.service';

interface JwtPayload {
  sessionId: string;
  adminId: string;
  email: string;
}

type RequestWithUser = Request & { user?: AccessAdminAuth };

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly adminSessionService: AdminSessionService,
    private readonly sessionRepository: SessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
    private readonly adminAuthService: AdminAuthService,
    private readonly cookieService: CookieService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();

    // 1. CSRF Protection (Double Submit Cookie)
    const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (stateChangingMethods.includes(request.method)) {
      const xsrfCookie = request.cookies?.['xsrf-token'] as string | undefined;
      const xsrfHeader = request.headers?.['x-xsrf-token'] as
        | string
        | undefined;

      if (!xsrfCookie || !xsrfHeader || xsrfCookie !== xsrfHeader) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }

    // 2. JWT Verification
    const accessToken = request.cookies?.adminAccessToken as string | undefined;
    const refreshToken = request.cookies?.adminRefreshToken as
      | string
      | undefined;

    let payload: JwtPayload | undefined;

    try {
      if (!accessToken) {
        throw new Error('No access token');
      }
      const verifiedPayload: unknown = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret: this.configService.jwtAdminAccessSecret,
        },
      );
      payload = verifiedPayload as JwtPayload;
    } catch {
      // Access token expired or missing, try refresh
      if (!refreshToken) {
        throw new UnauthorizedException('Authentication required');
      }

      try {
        const refreshResult =
          await this.adminAuthService.refreshTokens(refreshToken);

        // Update access token in cookies (Auto-refresh)
        this.cookieService.setAdminAccessToken(
          response,
          refreshResult.tokens.accessToken,
        );

        const verifiedPayload: unknown = await this.jwtService.verifyAsync(
          refreshResult.tokens.accessToken,
          {
            secret: this.configService.jwtAdminAccessSecret,
          },
        );
        payload = verifiedPayload as JwtPayload;
      } catch {
        throw new UnauthorizedException('Session expired');
      }
    }

    // 3. Session Validation in DB
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }
    const adminSession = await this.adminSessionService.getAdminSession(
      payload.sessionId,
    );

    if (!adminSession) {
      throw new UnauthorizedException('Invalid session');
    }

    const active = this.sessionRepository.isSessionActive(adminSession.session);
    if (!active) {
      throw new UnauthorizedException('Session expired');
    }

    const requestUser: AccessAdminAuth = {
      admin: adminSession.admin,
      session: adminSession.session,
    };

    request.user = requestUser;

    return true;
  }
}
