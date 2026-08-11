import { Injectable } from '@nestjs/common';
import type { TLockTransaction } from '@/libs/db/types';
import { CartRepository } from '../../repositories/cart.repository';

/**
 * Low-level read facade over `CartRepository` for cross-module callers (e.g. Order checkout).
 * HTTP-facing reads use `GetCartQuery`, `GetCartCountQuery`, and `ValidateCartQuery`.
 */
@Injectable()
export class CartQueryService {
  constructor(private readonly cartRepository: CartRepository) {}

  getCartByUserId(userId: string, transaction?: TLockTransaction) {
    return this.cartRepository.getCartByUserId(userId, transaction);
  }

  getCartById(cartId: string, transaction?: TLockTransaction) {
    return this.cartRepository.getCartById(cartId, transaction);
  }

  getCartByGuestToken(guestToken: string, transaction?: TLockTransaction) {
    return this.cartRepository.getCartByGuestToken(guestToken, transaction);
  }

  getCartWithItems(userId: string) {
    return this.cartRepository.getCartWithItems(userId);
  }

  getCartWithItemsByGuestToken(guestToken: string) {
    return this.cartRepository.getCartWithItemsByGuestToken(guestToken);
  }

  getCartWithItemsById(cartId: string) {
    return this.cartRepository.getCartWithItemsById(cartId);
  }

  getCartWithItemsAndShopById(cartId: string) {
    return this.cartRepository.getCartWithItemsAndShopById(cartId);
  }

  getCartItem(
    cartId: string,
    variantId: string,
    transaction?: TLockTransaction,
  ) {
    return this.cartRepository.getCartItem(cartId, variantId, transaction);
  }

  getCartItemById(cartItemId: string, transaction?: TLockTransaction) {
    return this.cartRepository.getCartItemById(cartItemId, transaction);
  }

  getCartItemsByCartId(cartId: string, transaction?: TLockTransaction) {
    return this.cartRepository.getCartItemsByCartId(cartId, transaction);
  }

  getCartItemsCount(cartId: string) {
    return this.cartRepository.getCartItemsCount(cartId);
  }

  getCartTotalQuantity(cartId: string) {
    return this.cartRepository.getCartTotalQuantity(cartId);
  }

  getInventoryByVariantIds(variantIds: string[]) {
    return this.cartRepository.getInventoryByVariantIds(variantIds);
  }

  getInventoryByVariantId(variantId: string) {
    return this.cartRepository.getInventoryByVariantId(variantId);
  }

  getInventoryByVariantIdLocked(
    variantId: string,
    transaction?: TLockTransaction,
  ) {
    return this.cartRepository.getInventoryByVariantIdLocked(
      variantId,
      transaction,
    );
  }
}
