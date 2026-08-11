import { Injectable } from '@nestjs/common';
import type { TLockTransaction } from '@/libs/db/types';
import {
  CartCommandService,
  CartQueryService,
} from '@/modules/cart/application';

@Injectable()
export class OrderCartIntegration {
  constructor(
    private readonly cartQueryService: CartQueryService,
    private readonly cartCommandService: CartCommandService,
  ) {}

  getCartWithItemsAndShopById(cartId: string) {
    return this.cartQueryService.getCartWithItemsAndShopById(cartId);
  }

  getInventoryByVariantIds(variantIds: string[]) {
    return this.cartQueryService.getInventoryByVariantIds(variantIds);
  }

  removeOrderedItems(itemIds: string[], transaction: TLockTransaction) {
    return this.cartCommandService.removeOrderedItems(itemIds, transaction);
  }

  getCartByUserId(userId: string) {
    return this.cartQueryService.getCartByUserId(userId);
  }

  getCartByGuestToken(guestToken: string) {
    return this.cartQueryService.getCartByGuestToken(guestToken);
  }
}
