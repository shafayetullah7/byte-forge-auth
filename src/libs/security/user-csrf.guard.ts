import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { assertUserCsrfToken } from './csrf';

@Injectable()
export class UserCsrfGuard implements CanActivate {
  constructor(private readonly configService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    assertUserCsrfToken(request, this.configService.allowedOrigins);
    return true;
  }
}
