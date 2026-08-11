import { Injectable } from '@nestjs/common';
import { GetCartService, CartResult } from './services/get-cart.service';
import {
  AddToCartService,
  AddToCartResult,
} from './services/add-to-cart.service';
import {
  UpdateCartItemService,
  UpdateCartItemResult,
} from './services/update-cart-item.service';
import { RemoveCartItemService } from './services/remove-cart-item.service';
import { ClearCartService } from './services/clear-cart.service';
import {
  ValidateCartService,
  ValidateCartResult,
} from './services/validate-cart.service';
import {
  BulkUpdateCartService,
  BulkUpdateCartResult,
} from './services/bulk-update-cart.service';
import {
  BulkRemoveCartService,
  BulkRemoveCartResult,
} from './services/bulk-remove-cart.service';
import {
  MergeCartService,
  MergeCartResult,
} from './services/merge-cart.service';
import {
  GetCartCountQuery,
  type CartCountResult,
} from '@/modules/cart/application/queries';
import {
  MergeGuestCartCommand,
  ResolveCartContextCommand,
} from '@/modules/cart/application/commands';
import { CartContext } from '@/common/types/cart-context.type';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { BulkUpdateCartItemsDto } from './dto/bulk-update-items.dto';
import { BulkRemoveCartItemsDto } from './dto/bulk-remove-items.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

export type { CartCountResult } from '@/modules/cart/application/queries/get-cart.query.types';

@Injectable()
export class CartService {
  constructor(
    private readonly getCartService: GetCartService,
    private readonly addToCartService: AddToCartService,
    private readonly updateCartItemService: UpdateCartItemService,
    private readonly removeCartItemService: RemoveCartItemService,
    private readonly clearCartService: ClearCartService,
    private readonly validateCartService: ValidateCartService,
    private readonly bulkUpdateCartService: BulkUpdateCartService,
    private readonly bulkRemoveCartService: BulkRemoveCartService,
    private readonly mergeCartService: MergeCartService,
    private readonly getCartCountQuery: GetCartCountQuery,
    private readonly resolveCartContextCommand: ResolveCartContextCommand,
    private readonly mergeGuestCartCommand: MergeGuestCartCommand,
  ) {}

  async mergeGuestCart(userId: string, guestToken: string): Promise<void> {
    return this.mergeGuestCartCommand.execute(userId, guestToken);
  }

  async getCart(
    context: CartContext,
    locale?: string,
  ): Promise<CartResult | null> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.getCartService.executeByCartId(resolved.cartId, locale);
  }

  async getCartCount(context: CartContext): Promise<CartCountResult> {
    return this.getCartCountQuery.execute(context);
  }

  async addToCart(
    context: CartContext,
    dto: AddToCartDto,
    locale?: string,
  ): Promise<AddToCartResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.addToCartService.executeByCartId(resolved.cartId, dto, locale);
  }

  async updateCartItem(
    context: CartContext,
    itemId: string,
    dto: UpdateCartItemDto,
    locale?: string,
  ): Promise<UpdateCartItemResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.updateCartItemService.executeByCartIdAndItem(
      resolved.cartId,
      itemId,
      dto,
      locale,
    );
  }

  async removeCartItem(context: CartContext, itemId: string): Promise<void> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.removeCartItemService.executeByCartIdAndItem(
      resolved.cartId,
      itemId,
    );
  }

  async clearCart(context: CartContext): Promise<void> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.clearCartService.executeByCartId(resolved.cartId);
  }

  async validateCart(
    context: CartContext,
    locale?: string,
  ): Promise<ValidateCartResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.validateCartService.executeByCartId(resolved.cartId, locale);
  }

  async bulkUpdateCartItems(
    context: CartContext,
    dto: BulkUpdateCartItemsDto,
    locale?: string,
  ): Promise<BulkUpdateCartResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.bulkUpdateCartService.executeByCartId(
      resolved.cartId,
      dto,
      locale,
    );
  }

  async bulkRemoveCartItems(
    context: CartContext,
    dto: BulkRemoveCartItemsDto,
  ): Promise<BulkRemoveCartResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.bulkRemoveCartService.executeByCartId(resolved.cartId, dto);
  }

  async mergeCart(
    context: CartContext,
    dto: MergeCartDto,
    locale?: string,
  ): Promise<MergeCartResult> {
    const resolved = await this.resolveCartContextCommand.execute(context);
    return this.mergeCartService.executeByCartId(resolved.cartId, dto, locale);
  }
}
