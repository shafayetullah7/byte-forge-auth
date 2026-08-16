import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserSessionRepository } from '@/modules/auth/repositories/user-session.repository';
import { SessionRepository } from '@/modules/auth/repositories/session.repository';
import { AccessUserAuth } from '@/libs/types';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { assertUserCsrfToken } from '@/libs/security/csrf';
import { JwtResourceGuard } from '@/libs/auth/jwt-resource.guard';
import { OidcIdentityProvisionerService } from '@/modules/auth/application/oidc-identity-provisioner.service';
import { RequestWithOidcAccessToken } from '@/libs/types/oidc-access-token.type';

type RequestWithUser = Request &
  RequestWithOidcAccessToken & { user?: AccessUserAuth };

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly userSessionRepository: UserSessionRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly configService: AppConfigService,
    private readonly jwtResourceGuard: JwtResourceGuard,
    private readonly oidcProvisioner: OidcIdentityProvisionerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const hasOidcCredential =
      request.headers.authorization?.startsWith('Bearer ') ||
      Boolean(request.cookies?.bfAccessToken);

    if (hasOidcCredential) {
      await this.jwtResourceGuard.canActivate(context);
      const token = request.oidcAccessToken;
      if (!token) {
        throw new UnauthorizedException('OIDC access token required');
      }

      const user = await this.oidcProvisioner.provisionFromToken(token);
      request.user = {
        user,
        session: null as unknown as AccessUserAuth['session'],
      };
      return true;
    }

    assertUserCsrfToken(request, this.configService.allowedOrigins);

    const sessionId = request.cookies?.sessionId as string | undefined;

    if (!sessionId) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const userSession =
      await this.userSessionRepository.findUserSessionDetailsBySessionId(
        sessionId,
      );

    if (!userSession) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const active = this.sessionRepository.isSessionActive(userSession.session);
    if (!active) {
      throw new UnauthorizedException('Unauthorized access. Session expired.');
    }

    request.user = {
      user: userSession.user,
      session: userSession.session,
    };

    return true;
  }
}
