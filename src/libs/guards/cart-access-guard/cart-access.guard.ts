import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtResourceGuard } from '@/libs/auth/jwt-resource.guard';
import { OidcIdentityProvisionerService } from '@/modules/auth/application/oidc-identity-provisioner.service';
import { CartContext, AccessUserAuth } from '@/libs/types';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { assertUserCsrfToken } from '@/libs/security/csrf';
import { RequestWithOidcAccessToken } from '@/libs/types/oidc-access-token.type';

type RequestWithCart = Request &
  RequestWithOidcAccessToken & {
    guestToken?: string;
    cartContext?: CartContext;
    user?: AccessUserAuth;
  };

@Injectable()
export class CartAccessGuard implements CanActivate {
  constructor(
    private readonly jwtResourceGuard: JwtResourceGuard,
    private readonly oidcProvisioner: OidcIdentityProvisionerService,
    private readonly configService: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCart>();

    assertUserCsrfToken(request, this.configService.allowedOrigins);

    const guestToken = request.guestToken;
    let userId: string | undefined;
    let pendingMerge = false;

    const hasOidcCredential =
      request.headers.authorization?.startsWith('Bearer ') ||
      Boolean(request.cookies?.bfAccessToken);

    if (hasOidcCredential) {
      await this.jwtResourceGuard.canActivate(context);
      const token = request.oidcAccessToken;
      if (token) {
        const user = await this.oidcProvisioner.resolveFromToken(token);
        userId = user.id;
        request.user = {
          user,
          session: null,
        };
      }
    }

    if (!userId && !guestToken) {
      throw new UnauthorizedException('Unauthorized access');
    }

    if (userId && guestToken) {
      pendingMerge = true;
    }

    request.cartContext = {
      userId,
      guestToken,
      pendingMerge,
    };

    return true;
  }
}
