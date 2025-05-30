import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { LocalAuthenticUser } from '../types';

export const LocalAuthenticUserParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): LocalAuthenticUser => {
    const req = ctx.switchToHttp().getRequest<Request>();

    const auth = req.user;
    if (!auth || auth.role !== 'user') {
      throw new UnauthorizedException('Unauthorized access');
    }

    if (!auth.userLocalAuth) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const { user, userLocalAuth } = auth;
    return { user, userLocalAuth };
  },
);
