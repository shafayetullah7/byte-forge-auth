import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { UserAuthGuard } from '@/libs/guards/user-auth-guard/user-auth.guard';

@Injectable()
export class OidcOrSessionGuard implements CanActivate {
  constructor(private readonly userAuthGuard: UserAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.userAuthGuard.canActivate(context);
  }
}
