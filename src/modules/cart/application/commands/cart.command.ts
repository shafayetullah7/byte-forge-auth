import { Injectable } from '@nestjs/common';
import type { TNewCart, TNewCartItem } from '@/_db/drizzle/schema';
import type { TLockTransaction } from '@/libs/db/types';
import { CartRepository } from '../../repositories/cart.repository';

/**
 * Low-level mutation facade over `CartRepository` for cross-module callers.
 * Prefer domain commands (`AddToCartCommand`, etc.) for HTTP flows.
 */
@Injectable()
export class CartCommandService {
  constructor(private readonly cartRepository: CartRepository) {}

  createCart(payload: TNewCart, transaction?: TLockTransaction) {
    return this.cartRepository.createCart(payload, transaction);
  }

  updateCart(
    cartId: string,
    data: Partial<Pick<TNewCart, 'userId' | 'guestToken'>>,
    transaction?: TLockTransaction,
  ) {
    return this.cartRepository.updateCart(cartId, data, transaction);
  }

  deleteCart(cartId: string, transaction?: TLockTransaction) {
    return this.cartRepository.deleteCart(cartId, transaction);
  }

  createCartItem(payload: TNewCartItem, transaction?: TLockTransaction) {
    return this.cartRepository.createCartItem(payload, transaction);
  }

  updateCartItem(
    cartItemId: string,
    data: Partial<Pick<TNewCartItem, 'quantity'>>,
    transaction?: TLockTransaction,
  ) {
    return this.cartRepository.updateCartItem(cartItemId, data, transaction);
  }

  deleteCartItem(cartItemId: string, transaction?: TLockTransaction) {
    return this.cartRepository.deleteCartItem(cartItemId, transaction);
  }

  deleteAllCartItems(cartId: string, transaction?: TLockTransaction) {
    return this.cartRepository.deleteAllCartItems(cartId, transaction);
  }

  deleteCartItemsByIds(itemIds: string[], transaction?: TLockTransaction) {
    return this.cartRepository.deleteCartItemsByIds(itemIds, transaction);
  }

  removeOrderedItems(itemIds: string[], transaction: TLockTransaction) {
    return this.deleteCartItemsByIds(itemIds, transaction);
  }
}
