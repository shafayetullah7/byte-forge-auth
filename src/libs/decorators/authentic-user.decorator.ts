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
    if (!auth) {
      throw new UnauthorizedException('Unauthorized access');
    }

    if (!auth.session) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const { user, session } = auth;
    return { user, session };
  },
);
