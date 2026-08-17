import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserAuthGuard } from '@/libs/guards/user-auth-guard/user-auth.guard';
import { EmailVerifiedGuard } from '../email-verified-guard/email-verified.guard';
import { ShopQueryService } from '@/modules/shop/application/queries';
import { Request } from 'express';
import { AccessUserAuth } from '@/libs/types';

type RequestWithUser = Request & { user?: AccessUserAuth };

@Injectable()
export class VerifiedUserAuthGuard implements CanActivate {
  constructor(
    private readonly userAuthGuard: UserAuthGuard,
    private readonly emailVerifiedGuard: EmailVerifiedGuard,
    private readonly shopQueryService: ShopQueryService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await this.userAuthGuard.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const isEmailVerified = this.emailVerifiedGuard.canActivate(context);
    if (!isEmailVerified) {
      return false;
    }

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
