import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticUser } from '../types';

export const AuthenticUserParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticUser => {
    const req = ctx.switchToHttp().getRequest<Request>();

    const auth = req.user;
    if (!auth || auth.role !== 'user') {
      throw new UnauthorizedException('Unauthorized access');
    }

    if (!auth.session) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const { user, session } = auth;
    return { user, session };
  },
);
