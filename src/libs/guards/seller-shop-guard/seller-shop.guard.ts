import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessUserAuth } from '@/libs/types';

type RequestWithUser = Request & { user?: AccessUserAuth };

@Injectable()
export class SellerShopGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const auth = request.user;

    if (!auth?.shop) {
      throw new ForbiddenException('No active shop found for this seller');
    }

    return true;
  }
}
