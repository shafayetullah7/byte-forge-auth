import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { OidcOrSessionGuard } from '@/libs/guards/oidc-or-session-guard/oidc-or-session.guard';
import { EmailVerifiedGuard } from '../email-verified-guard/email-verified.guard';
import { ShopQueryService } from '@/modules/shop/application/queries';
import { Request } from 'express';
import { AccessUserAuth } from '@/libs/types';

type RequestWithUser = Request & { user?: AccessUserAuth };

@Injectable()
export class VerifiedUserAuthGuard implements CanActivate {
  constructor(
    private readonly oidcOrSessionGuard: OidcOrSessionGuard,
    private readonly emailVerifiedGuard: EmailVerifiedGuard,
    private readonly shopQueryService: ShopQueryService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await this.oidcOrSessionGuard.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    // 2. Check email verification
    const isEmailVerified = this.emailVerifiedGuard.canActivate(context);
    if (!isEmailVerified) {
      return false;
    }

    // 3. Optionally attach shop (best-effort — shop may be undefined)
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const auth = request.user;
    if (!auth) {
      return false;
    }
    const shop = await this.shopQueryService.getShopByOwnerId(auth.user.id);
    request.user = { ...auth, shop: shop ?? undefined };

    return true;
  }
}
