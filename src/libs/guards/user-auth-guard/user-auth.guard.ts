import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessUserAuth } from '@/libs/types';
import { JwtResourceGuard } from '@/libs/auth/jwt-resource.guard';
import { OidcIdentityProvisionerService } from '@/modules/auth/application/oidc-identity-provisioner.service';
import { RequestWithOidcAccessToken } from '@/libs/types/oidc-access-token.type';

type RequestWithUser = Request &
  RequestWithOidcAccessToken & { user?: AccessUserAuth };

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly jwtResourceGuard: JwtResourceGuard,
    private readonly oidcProvisioner: OidcIdentityProvisionerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const hasOidcCredential =
      request.headers.authorization?.startsWith('Bearer ') ||
      Boolean(request.cookies?.bfAccessToken);

    if (!hasOidcCredential) {
      throw new UnauthorizedException('OIDC access token required');
    }

    await this.jwtResourceGuard.canActivate(context);
    const token = request.oidcAccessToken;
    if (!token) {
      throw new UnauthorizedException('OIDC access token required');
    }

    const user = await this.oidcProvisioner.provisionFromToken(token);
    request.user = {
      user,
      session: null,
    };

    return true;
  }
}
