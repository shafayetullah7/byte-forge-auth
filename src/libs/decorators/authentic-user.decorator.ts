import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TAuthenticUser } from '../types';

export const AuthenticUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TAuthenticUser => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: TAuthenticUser }>();
    const auth = req.user;
    if (!auth?.user) {
      throw new UnauthorizedException('Unauthorized access');
    }

    return { user: auth.user, session: auth.session ?? null };
  },
);
