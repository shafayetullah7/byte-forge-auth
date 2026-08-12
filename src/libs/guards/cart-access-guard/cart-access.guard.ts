import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserSessionRepository } from '@/modules/auth/repositories/user-session.repository';
import { SessionRepository } from '@/modules/auth/repositories/session.repository';
import { CartContext, AccessUserAuth } from '@/libs/types';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { assertUserCsrfToken } from '@/libs/security/csrf';

type RequestWithCart = Request & {
  guestToken?: string;
  cartContext?: CartContext;
  user?: AccessUserAuth;
};

@Injectable()
export class CartAccessGuard implements CanActivate {
  constructor(
    private readonly userSessionRepository: UserSessionRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly configService: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCart>();

    assertUserCsrfToken(request, this.configService.allowedOrigins);

    const sessionId = request.cookies?.sessionId as string | undefined;
    const guestToken = request.guestToken;

    let userId: string | undefined;
    let pendingMerge = false;

    if (sessionId) {
      const userSession =
        await this.userSessionRepository.findUserSessionDetailsBySessionId(
          sessionId,
        );

      if (userSession) {
        const active = this.sessionRepository.isSessionActive(
          userSession.session,
        );
        if (active) {
          userId = userSession.user.id;
          request.user = {
            user: userSession.user,
            session: userSession.session,
          };
        }
      }
    }

    if (!userId && !guestToken) {
      throw new UnauthorizedException('Unauthorized access');
    }

    if (userId && guestToken) {
      pendingMerge = true;
    }

    const cartContext: CartContext = {
      userId,
      guestToken,
      pendingMerge,
    };

    request.cartContext = cartContext;

    return true;
  }
}
