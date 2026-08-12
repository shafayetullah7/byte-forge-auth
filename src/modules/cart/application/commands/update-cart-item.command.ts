import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CustomException } from '@/libs/exceptions/custom.exception';
import {
  assertSufficientStock,
  assertVariantAvailableForPurchase,
  assertVariantExists,
} from '../assert-cart-variant.util';
import { mapVariantRowToCartItemResult } from '../../mappers/cart.mapper';
import { CartRepository } from '../../repositories/cart.repository';
import type {
  UpdateCartItemParams,
  UpdateCartItemResult,
} from './cart-command.types';

@Injectable()
export class UpdateCartItemCommand {
  private readonly logger = new Logger(UpdateCartItemCommand.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly db: DrizzleService,
  ) {}

  async execute(params: UpdateCartItemParams): Promise<UpdateCartItemResult> {
    const locale = params.locale ?? 'en';

    try {
      return await this.db.transaction(async (tx) => {
        const lockTx = { tx, lock: true };

        const cartItem = await this.cartRepository.getCartItemById(
          params.itemId,
          lockTx,
        );

        if (!cartItem || cartItem.cartId !== params.cartId) {
          throw CustomException.notFound({
            message: 'Cart item not found',
            details: `Item ID: ${params.itemId}`,
          });
        }

        const variant = await this.cartRepository.getVariantForCartOperation(
          cartItem.variantId,
        );
        assertVariantExists(variant);
        assertVariantAvailableForPurchase(variant);

        const inventory =
          (await this.cartRepository.getInventoryByVariantIdLocked(
            cartItem.variantId,
            lockTx,
          )) ?? null;

        assertSufficientStock(inventory, params.quantity);

        const updatedItem = await this.cartRepository.updateCartItem(
          params.itemId,
          { quantity: params.quantity },
          lockTx,
        );

        return mapVariantRowToCartItemResult(
          updatedItem,
          variant,
          inventory,
          locale,
        );
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to update cart item ${params.itemId} in cart ${params.cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
