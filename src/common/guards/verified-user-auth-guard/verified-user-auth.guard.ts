import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserAuthGuard } from '../user-auth-guard/user-auth.guard';
import { EmailVerifiedGuard } from '../email-verified-guard/email-verified.guard';
import { ShopRepository } from '@/modules/shop/repositories';
import { Request } from 'express';
import { AccessUserAuth } from '@/common/types';

type RequestWithUser = Request & { user?: AccessUserAuth };

@Injectable()
export class VerifiedUserAuthGuard implements CanActivate {
  constructor(
    private readonly userAuthGuard: UserAuthGuard,
    private readonly emailVerifiedGuard: EmailVerifiedGuard,
    private readonly shopRepository: ShopRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check authentication
    const isAuthenticated = await this.userAuthGuard.canActivate(context);
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
    const shop = await this.shopRepository.getShopByOwnerId(auth.user.id);
    request.user = { ...auth, shop: shop ?? undefined };

    return true;
  }
}
