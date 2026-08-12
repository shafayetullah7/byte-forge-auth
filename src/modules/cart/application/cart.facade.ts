import { Injectable } from '@nestjs/common';
import type { CartContext } from '@/libs/types/cart-context.type';
import {
  AddToCartCommand,
  BulkRemoveCartCommand,
  BulkUpdateCartCommand,
  ClearCartCommand,
  MergeCartCommand,
  MergeGuestCartCommand,
  RemoveCartItemCommand,
  ResolveCartContextCommand,
  UpdateCartItemCommand,
  type AddToCartResult,
  type BulkRemoveCartResult,
  type BulkUpdateCartResult,
  type MergeCartResult,
  type UpdateCartItemResult,
} from './commands';
import {
  GetCartCountQuery,
  GetCartQuery,
  ValidateCartQuery,
  type CartCountResult,
  type CartResult,
  type ValidateCartResult,
} from './queries';
import type { AddToCartDto } from '../controllers/dto/add-to-cart.dto';
import type { BulkRemoveCartItemsDto } from '../controllers/dto/bulk-remove-items.dto';
import type { BulkUpdateCartItemsDto } from '../controllers/dto/bulk-update-items.dto';
import type { MergeCartDto } from '../controllers/dto/merge-cart.dto';
import type { UpdateCartItemDto } from '../controllers/dto/update-cart-item.dto';

export type {
  AddToCartResult,
  BulkRemoveCartResult,
  BulkUpdateCartResult,
  CartCountResult,
  CartResult,
  MergeCartResult,
  UpdateCartItemResult,
  ValidateCartResult,
};

@Injectable()
export class CartFacade {
  constructor(
    private readonly getCartQuery: GetCartQuery,
    private readonly getCartCountQuery: GetCartCountQuery,
    private readonly validateCartQuery: ValidateCartQuery,
    private readonly addToCartCommand: AddToCartCommand,
    private readonly updateCartItemCommand: UpdateCartItemCommand,
    private readonly removeCartItemCommand: RemoveCartItemCommand,
    private readonly clearCartCommand: ClearCartCommand,
    private readonly bulkUpdateCartCommand: BulkUpdateCartCommand,
    private readonly bulkRemoveCartCommand: BulkRemoveCartCommand,
    private readonly mergeCartCommand: MergeCartCommand,
    private readonly resolveCartContextCommand: ResolveCartContextCommand,
    private readonly mergeGuestCartCommand: MergeGuestCartCommand,
  ) {}

  mergeGuestCart(userId: string, guestToken: string): Promise<void> {
    return this.mergeGuestCartCommand.execute(userId, guestToken);
  }

  async getCart(
    context: CartContext,
    locale?: string,
  ): Promise<CartResult | null> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.getCartQuery.execute(resolved.cartId, locale);
  }

  getCartCount(context: CartContext): Promise<CartCountResult> {
    return this.getCartCountQuery.execute(context);
  }

  async addToCart(
    context: CartContext,
    dto: AddToCartDto,
    locale?: string,
  ): Promise<AddToCartResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.addToCartCommand.execute({
      cartId: resolved.cartId,
      variantId: dto.variantId,
      quantity: dto.quantity,
      locale,
    });
  }

  async updateCartItem(
    context: CartContext,
    itemId: string,
    dto: UpdateCartItemDto,
    locale?: string,
  ): Promise<UpdateCartItemResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.updateCartItemCommand.execute({
      cartId: resolved.cartId,
      itemId,
      quantity: dto.quantity,
      locale,
    });
  }

  async removeCartItem(context: CartContext, itemId: string): Promise<void> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.removeCartItemCommand.execute(resolved.cartId, itemId);
  }

  async clearCart(context: CartContext): Promise<void> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.clearCartCommand.execute(resolved.cartId);
  }

  async validateCart(
    context: CartContext,
    locale?: string,
  ): Promise<ValidateCartResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.validateCartQuery.execute(resolved.cartId, locale);
  }

  async bulkUpdateCartItems(
    context: CartContext,
    dto: BulkUpdateCartItemsDto,
    locale?: string,
  ): Promise<BulkUpdateCartResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.bulkUpdateCartCommand.execute({
      cartId: resolved.cartId,
      items: dto.items,
      locale,
    });
  }

  async bulkRemoveCartItems(
    context: CartContext,
    dto: BulkRemoveCartItemsDto,
  ): Promise<BulkRemoveCartResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.bulkRemoveCartCommand.execute({
      cartId: resolved.cartId,
      itemIds: dto.itemIds,
    });
  }

  async mergeCart(
    context: CartContext,
    dto: MergeCartDto,
    locale?: string,
  ): Promise<MergeCartResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.mergeCartCommand.execute({
      cartId: resolved.cartId,
      guestItems: dto.guestItems,
      locale,
    });
  }
}
