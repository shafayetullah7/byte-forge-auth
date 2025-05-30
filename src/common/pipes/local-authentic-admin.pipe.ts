import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { LocalAuthenticAdmin } from '../types';

export const LocalAuthenticAdminParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): LocalAuthenticAdmin => {
    const req = ctx.switchToHttp().getRequest<Request>();

    const auth = req.user;
    if (!auth || auth.role !== 'admin') {
      throw new UnauthorizedException('Unauthorized access');
    }

    if (!auth.adminLocalAuth) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const { admin, adminLocalAuth } = auth;
    return { admin, adminLocalAuth };
  },
);
