import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CartQueryService } from '../queries/cart.query';
import { CartCommandService } from './cart.command';

@Injectable()
export class MergeGuestCartCommand {
  constructor(
    private readonly cartQueryService: CartQueryService,
    private readonly cartCommandService: CartCommandService,
    private readonly db: DrizzleService,
  ) {}

  async execute(userId: string, guestToken: string): Promise<void> {
    if (!userId || !guestToken) {
      return;
    }

    await this.db.transaction(async (tx) => {
      const lockTx = { tx, lock: true };
      const userCart = await this.cartQueryService.getCartByUserId(
        userId,
        lockTx,
      );
      const guestCart = await this.cartQueryService.getCartByGuestToken(
        guestToken,
        lockTx,
      );

      if (!guestCart) {
        if (!userCart) {
          await this.cartCommandService.createCart({ userId }, { tx });
        }
        return;
      }

      if (!userCart) {
        await this.cartCommandService.updateCart(
          guestCart.id,
          { userId, guestToken: null },
          { tx },
        );
        return;
      }

      const guestItems = await this.cartQueryService.getCartItemsByCartId(
        guestCart.id,
        lockTx,
      );

      for (const item of guestItems) {
        const existingItem = await this.cartQueryService.getCartItem(
          userCart.id,
          item.variantId,
          lockTx,
        );

        if (existingItem) {
          await this.cartCommandService.updateCartItem(
            existingItem.id,
            { quantity: existingItem.quantity + item.quantity },
            { tx },
          );
        } else {
          await this.cartCommandService.createCartItem(
            {
              cartId: userCart.id,
              variantId: item.variantId,
              quantity: item.quantity,
            },
            { tx },
          );
        }
      }

      await this.cartCommandService.deleteAllCartItems(guestCart.id, { tx });
      await this.cartCommandService.deleteCart(guestCart.id, { tx });
    });
  }
}
