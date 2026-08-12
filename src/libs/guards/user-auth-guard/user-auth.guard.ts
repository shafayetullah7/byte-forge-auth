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

type RequestWithUser = Request & { user?: AccessUserAuth };

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly userSessionRepository: UserSessionRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly configService: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

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
