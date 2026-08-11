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
import { CartRepository } from '@/modules/cart/repositories';
import {
  GetCartCountQuery,
  type CartCountResult,
} from '@/modules/cart/application/queries';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CartContext } from '@/common/types/cart-context.type';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { BulkUpdateCartItemsDto } from './dto/bulk-update-items.dto';
import { BulkRemoveCartItemsDto } from './dto/bulk-remove-items.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

export type { CartCountResult } from '@/modules/cart/application/queries/get-cart.query.types';

const isUniqueConstraintError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: string }).code;
  return code === '23505';
};

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
    private readonly cartRepository: CartRepository,
    private readonly db: DrizzleService,
  ) {}

  async mergeGuestCart(userId: string, guestToken: string): Promise<void> {
    if (!userId || !guestToken) {
      return;
    }
    await this.handleAutoMerge(userId, guestToken);
  }

  private async resolveCartContext(
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
      const cart = await this.cartRepository.getCartByUserId(userId, lockTx);
      if (cart) {
        return { userId, cartId: cart.id };
      }

      try {
        const newCart = await this.cartRepository.createCart(
          { userId },
          { tx },
        );
        return { userId, cartId: newCart.id };
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
        const existingCart = await this.cartRepository.getCartByUserId(
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
      const cart = await this.cartRepository.getCartByGuestToken(
        guestToken,
        lockTx,
      );
      if (cart) {
        return { guestToken, cartId: cart.id };
      }

      try {
        const newCart = await this.cartRepository.createCart(
          { guestToken },
          { tx },
        );
        return { guestToken, cartId: newCart.id };
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
        const existingCart = await this.cartRepository.getCartByGuestToken(
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

  private async handleAutoMerge(
    userId: string,
    guestToken: string,
  ): Promise<{ userId: string; cartId: string }> {
    return await this.db.transaction(async (tx) => {
      const lockTx = { tx, lock: true };
      const userCart = await this.cartRepository.getCartByUserId(
        userId,
        lockTx,
      );
      const guestCart = await this.cartRepository.getCartByGuestToken(
        guestToken,
        lockTx,
      );

      if (!guestCart) {
        if (!userCart) {
          const newCart = await this.cartRepository.createCart(
            { userId },
            { tx },
          );
          return { userId, cartId: newCart.id };
        }
        return { userId, cartId: userCart.id };
      }

      if (!userCart) {
        await this.cartRepository.updateCart(
          guestCart.id,
          { userId, guestToken: null },
          { tx },
        );
        return { userId, cartId: guestCart.id };
      }

      const guestItems = await this.cartRepository.getCartItemsByCartId(
        guestCart.id,
        lockTx,
      );

      for (const item of guestItems) {
        const existingItem = await this.cartRepository.getCartItem(
          userCart.id,
          item.variantId,
          lockTx,
        );

        if (existingItem) {
          await this.cartRepository.updateCartItem(
            existingItem.id,
            { quantity: existingItem.quantity + item.quantity },
            { tx },
          );
        } else {
          await this.cartRepository.createCartItem(
            {
              cartId: userCart.id,
              variantId: item.variantId,
              quantity: item.quantity,
            },
            { tx },
          );
        }
      }

      await this.cartRepository.deleteAllCartItems(guestCart.id, { tx });
      await this.cartRepository.deleteCart(guestCart.id, { tx });

      return { userId, cartId: userCart.id };
    });
  }

  async getCart(
    context: CartContext,
    locale?: string,
  ): Promise<CartResult | null> {
    const resolved = await this.resolveCartContext(context);
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
    const resolved = await this.resolveCartContext(context);
    return this.addToCartService.executeByCartId(resolved.cartId, dto, locale);
  }

  async updateCartItem(
    context: CartContext,
    itemId: string,
    dto: UpdateCartItemDto,
    locale?: string,
  ): Promise<UpdateCartItemResult> {
    const resolved = await this.resolveCartContext(context);
    return this.updateCartItemService.executeByCartIdAndItem(
      resolved.cartId,
      itemId,
      dto,
      locale,
    );
  }

  async removeCartItem(context: CartContext, itemId: string): Promise<void> {
    const resolved = await this.resolveCartContext(context);
    return this.removeCartItemService.executeByCartIdAndItem(
      resolved.cartId,
      itemId,
    );
  }

  async clearCart(context: CartContext): Promise<void> {
    const resolved = await this.resolveCartContext(context);
    return this.clearCartService.executeByCartId(resolved.cartId);
  }

  async validateCart(
    context: CartContext,
    locale?: string,
  ): Promise<ValidateCartResult> {
    const resolved = await this.resolveCartContext(context);
    return this.validateCartService.executeByCartId(resolved.cartId, locale);
  }

  async bulkUpdateCartItems(
    context: CartContext,
    dto: BulkUpdateCartItemsDto,
    locale?: string,
  ): Promise<BulkUpdateCartResult> {
    const resolved = await this.resolveCartContext(context);
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
    const resolved = await this.resolveCartContext(context);
    return this.bulkRemoveCartService.executeByCartId(resolved.cartId, dto);
  }

  async mergeCart(
    context: CartContext,
    dto: MergeCartDto,
    locale?: string,
  ): Promise<MergeCartResult> {
    const resolved = await this.resolveCartContext(context);
    return this.mergeCartService.executeByCartId(resolved.cartId, dto, locale);
  }
}
