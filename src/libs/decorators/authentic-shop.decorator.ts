import {
  createParamDecorator,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { TAuthorizedShop } from '../types';

/**
 * Extracts the shop from req.user.shop (populated by VerifiedUserAuthGuard).
 * Throws NotFoundException if the shop is not present.
 * Must be used together with @UseGuards(VerifiedUserAuthGuard, SellerShopGuard).
 */
export const AuthenticShop = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TAuthorizedShop => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: { shop?: TAuthorizedShop } }>();
    const auth = req.user;

    if (!auth?.shop) {
      throw new NotFoundException('Shop not found');
    }

    return auth.shop;
  },
);
