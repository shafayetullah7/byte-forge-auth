import { Injectable } from '@nestjs/common';
import { CartRepository } from '@/_repositories/user/cart.repository';
import type { TLockTransaction } from '@/libs/db/types';

@Injectable()
export class OrderCartIntegration {
  constructor(private readonly cartRepository: CartRepository) {}

  getCartWithItemsAndShopById(cartId: string) {
    return this.cartRepository.getCartWithItemsAndShopById(cartId);
  }

  getInventoryByVariantIds(variantIds: string[]) {
    return this.cartRepository.getInventoryByVariantIds(variantIds);
  }

  deleteCartItemsByIds(itemIds: string[], transaction?: TLockTransaction) {
    return this.cartRepository.deleteCartItemsByIds(itemIds, transaction);
  }

  getCartByUserId(userId: string) {
    return this.cartRepository.getCartByUserId(userId);
  }

  getCartByGuestToken(guestToken: string) {
    return this.cartRepository.getCartByGuestToken(guestToken);
  }
}
