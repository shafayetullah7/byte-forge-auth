import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { CartContext as CartContextType } from '@/libs/types/cart-context.type';

export const CartContextParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CartContextType => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { cartContext: CartContextType }>();
    return req.cartContext;
  },
);
