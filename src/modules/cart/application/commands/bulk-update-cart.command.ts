import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ProductStatusEnum } from '@/_db/drizzle/enum';
import {
  assertSufficientStock,
  getAvailableQuantity,
} from '../assert-cart-variant.util';
import { mapVariantRowToCartItemResult } from '../../mappers/cart.mapper';
import { CartRepository } from '../../repositories/cart.repository';
import { CartCommandService } from './cart.command';
import type {
  BulkUpdateCartParams,
  BulkUpdateCartResult,
} from './cart-command.types';

@Injectable()
export class BulkUpdateCartCommand {
  private readonly logger = new Logger(BulkUpdateCartCommand.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartCommandService: CartCommandService,
    private readonly db: DrizzleService,
  ) {}

  async execute(params: BulkUpdateCartParams): Promise<BulkUpdateCartResult> {
    const locale = params.locale ?? 'en';

    try {
      return await this.db.transaction(async (tx) => {
        const lockTx = { tx, lock: true };
        const cart = await this.cartRepository.getCartWithItemsById(
          params.cartId,
        );

        if (!cart) {
          throw CustomException.notFound({
            message: 'Cart not found',
            details: 'No cart exists',
          });
        }

        const updated: BulkUpdateCartResult['updated'] = [];
        const removed: BulkUpdateCartResult['removed'] = [];
        const errors: BulkUpdateCartResult['errors'] = [];

        for (const updateItem of params.items) {
          try {
            const cartItem = await this.cartRepository.getCartItemById(
              updateItem.itemId,
              lockTx,
            );

            if (!cartItem || cartItem.cartId !== params.cartId) {
              errors.push({
                itemId: updateItem.itemId,
                error: 'Cart item not found',
              });
              continue;
            }

            if (updateItem.quantity === 0) {
              await this.cartCommandService.deleteCartItem(updateItem.itemId, {
                tx,
              });
              removed.push({
                itemId: updateItem.itemId,
                variantId: cartItem.variantId,
              });
              continue;
            }

            const variant =
              await this.cartRepository.getVariantForCartOperation(
                cartItem.variantId,
              );

            if (!variant) {
              errors.push({
                itemId: updateItem.itemId,
                error: 'Product variant not found',
              });
              continue;
            }

            if (!variant.isActive) {
              errors.push({
                itemId: updateItem.itemId,
                error: 'Product variant is not available',
              });
              continue;
            }

            if (
              !variant.product ||
              variant.product.status !== ProductStatusEnum.ACTIVE
            ) {
              errors.push({
                itemId: updateItem.itemId,
                error: 'Product is not available for purchase',
              });
              continue;
            }

            const inventory =
              (await this.cartRepository.getInventoryByVariantIdLocked(
                cartItem.variantId,
                lockTx,
              )) ?? null;

            try {
              assertSufficientStock(inventory, updateItem.quantity);
            } catch {
              const available = getAvailableQuantity(inventory);
              errors.push({
                itemId: updateItem.itemId,
                error: `Insufficient stock. Only ${available ?? 0} available`,
              });
              continue;
            }

            const updatedItem = await this.cartCommandService.updateCartItem(
              updateItem.itemId,
              { quantity: updateItem.quantity },
              lockTx,
            );

            updated.push(
              mapVariantRowToCartItemResult(
                updatedItem,
                variant,
                inventory,
                locale,
              ),
            );
          } catch {
            errors.push({
              itemId: updateItem.itemId,
              error: 'Failed to update item',
            });
          }
        }

        return { updated, removed, errors };
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to bulk update cart ${params.cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
