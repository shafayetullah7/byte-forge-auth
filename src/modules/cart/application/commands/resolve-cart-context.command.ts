import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { CartContext } from '@/libs/types/cart-context.type';
import { CartQueryService } from '../queries/cart.query';
import { CartCommandService } from './cart.command';

const isUniqueConstraintError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: string }).code;
  return code === '23505';
};

@Injectable()
export class ResolveCartContextCommand {
  constructor(
    private readonly cartQueryService: CartQueryService,
    private readonly cartCommandService: CartCommandService,
    private readonly db: DrizzleService,
  ) {}

  async execute(
    context: CartContext,
  ): Promise<{ userId?: string; guestToken?: string; cartId: string }> {
    const { userId, guestToken } = context;

    if (userId) {
      return await this.resolveUserCart(userId);
    }

    if (guestToken) {
      return await this.resolveGuestCart(guestToken);
    }

    throw new Error('No valid cart context provided');
  }

  private async resolveUserCart(
    userId: string,
  ): Promise<{ userId: string; cartId: string }> {
    return await this.db.transaction(async (tx) => {
      const lockTx = { tx, lock: true };
      const cart = await this.cartQueryService.getCartByUserId(userId, lockTx);
      if (cart) {
        return { userId, cartId: cart.id };
      }

      try {
        const newCart = await this.cartCommandService.createCart(
          { userId },
          {
            tx,
          },
        );
        return { userId, cartId: newCart.id };
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
        const existingCart = await this.cartQueryService.getCartByUserId(
          userId,
          lockTx,
        );
        if (existingCart) {
          return { userId, cartId: existingCart.id };
        }
        throw new Error('Failed to create or find user cart');
      }
    });
  }

  private async resolveGuestCart(
    guestToken: string,
  ): Promise<{ guestToken: string; cartId: string }> {
    return await this.db.transaction(async (tx) => {
      const lockTx = { tx, lock: true };
      const cart = await this.cartQueryService.getCartByGuestToken(
        guestToken,
        lockTx,
      );
      if (cart) {
        return { guestToken, cartId: cart.id };
      }

      try {
        const newCart = await this.cartCommandService.createCart(
          { guestToken },
          { tx },
        );
        return { guestToken, cartId: newCart.id };
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
        const existingCart = await this.cartQueryService.getCartByGuestToken(
          guestToken,
          lockTx,
        );
        if (existingCart) {
          return { guestToken, cartId: existingCart.id };
        }
        throw new Error('Failed to create or find guest cart');
      }
    });
  }
}
