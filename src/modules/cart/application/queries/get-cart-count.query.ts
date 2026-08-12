import { Injectable } from '@nestjs/common';
import type { CartContext } from '@/libs/types/cart-context.type';
import { CartQueryService } from './cart.query';
import type { CartCountResult } from './get-cart.query.types';

@Injectable()
export class GetCartCountQuery {
  constructor(private readonly cartQueryService: CartQueryService) {}

  async execute(context: CartContext): Promise<CartCountResult> {
    if (context.userId) {
      return this.getCountForCart(
        await this.cartQueryService.getCartByUserId(context.userId),
      );
    }

    if (context.guestToken) {
      return this.getCountForCart(
        await this.cartQueryService.getCartByGuestToken(context.guestToken),
      );
    }

    return { itemsCount: 0, totalQuantity: 0 };
  }

  private async getCountForCart(
    cart: { id: string } | undefined,
  ): Promise<CartCountResult> {
    if (!cart) {
      return { itemsCount: 0, totalQuantity: 0 };
    }

    const [itemsCount, totalQuantity] = await Promise.all([
      this.cartQueryService.getCartItemsCount(cart.id),
      this.cartQueryService.getCartTotalQuantity(cart.id),
    ]);

    return { itemsCount, totalQuantity };
  }
}
