import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticAdmin } from '../types';

export const AuthenticAdminParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticAdmin => {
    const req = ctx.switchToHttp().getRequest<Request>();

    const auth = req.user;
    if (!auth || auth.role !== 'admin') {
      throw new UnauthorizedException('Unauthorized access');
    }

    if (!auth.session) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const { admin, session } = auth;
    return { admin, session };
  },
);
