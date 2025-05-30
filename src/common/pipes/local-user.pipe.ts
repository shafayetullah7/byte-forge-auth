import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export const LocalUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();

    const auth = req.user;
    if (!auth || auth.role !== 'user') {
      throw new UnauthorizedException('Unauthorized access');
    }
    if (!auth.userLocalAuth) {
      throw new UnauthorizedException('Unauthorized access');
    }

    return auth;
  },
);
