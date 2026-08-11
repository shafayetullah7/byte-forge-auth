import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { ProductStatusEnum } from '@/_db/drizzle/enum';
import { getAvailableQuantity } from '../assert-cart-variant.util';
import { mapCartWithItemsToResult } from '../../mappers/cart.mapper';
import { CartRepository } from '../../repositories/cart.repository';
import { CartCommandService } from './cart.command';
import type { MergeCartParams, MergeCartResult } from './cart-command.types';

@Injectable()
export class MergeCartCommand {
  private readonly logger = new Logger(MergeCartCommand.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartCommandService: CartCommandService,
    private readonly db: DrizzleService,
  ) {}

  async execute(params: MergeCartParams): Promise<MergeCartResult> {
    const locale = params.locale ?? 'en';

    try {
      return await this.db.transaction(async (tx) => {
        const lockTx = { tx, lock: true };
        const cart = await this.cartRepository.getCartWithItemsById(
          params.cartId,
        );

        if (!cart) {
          throw new Error('Cart not found');
        }

        const failedItems: MergeCartResult['failedItems'] = [];

        for (const guestItem of params.guestItems) {
          try {
            const variant =
              await this.cartRepository.getVariantForCartOperation(
                guestItem.variantId,
              );

            if (!variant) {
              failedItems.push({
                variantId: guestItem.variantId,
                reason: 'Product variant not found',
              });
              continue;
            }

            if (!variant.isActive) {
              failedItems.push({
                variantId: guestItem.variantId,
                reason: 'Product variant is not available',
              });
              continue;
            }

            if (
              !variant.product ||
              variant.product.status !== ProductStatusEnum.ACTIVE
            ) {
              failedItems.push({
                variantId: guestItem.variantId,
                reason: 'Product is not available for purchase',
              });
              continue;
            }

            const inventory =
              (await this.cartRepository.getInventoryByVariantIdLocked(
                guestItem.variantId,
                lockTx,
              )) ?? null;

            const existingItem = await this.cartRepository.getCartItem(
              cart.id,
              guestItem.variantId,
              lockTx,
            );

            if (inventory?.trackInventory) {
              const availableQuantity = getAvailableQuantity(inventory) ?? 0;
              const currentQuantity = existingItem?.quantity ?? 0;
              if (availableQuantity < currentQuantity + guestItem.quantity) {
                failedItems.push({
                  variantId: guestItem.variantId,
                  reason: `Insufficient stock. Only ${availableQuantity} available`,
                });
                continue;
              }
            }

            if (existingItem) {
              await this.cartCommandService.updateCartItem(
                existingItem.id,
                { quantity: existingItem.quantity + guestItem.quantity },
                lockTx,
              );
            } else {
              await this.cartCommandService.createCartItem(
                {
                  cartId: cart.id,
                  variantId: guestItem.variantId,
                  quantity: guestItem.quantity,
                },
                { tx },
              );
            }
          } catch {
            failedItems.push({
              variantId: guestItem.variantId,
              reason: 'Failed to merge item',
            });
          }
        }

        const updatedCart = await this.cartRepository.getCartWithItemsById(
          params.cartId,
        );
        if (!updatedCart) {
          throw new Error('Failed to retrieve cart after merge');
        }

        const variantIds = updatedCart.items.map((item) => item.variantId);
        const inventories =
          await this.cartRepository.getInventoryByVariantIds(variantIds);

        return {
          mergedCount: params.guestItems.length - failedItems.length,
          failedItems,
          cart: mapCartWithItemsToResult(updatedCart, locale, inventories),
        };
      });
    } catch (error) {
      this.logger.error(
        `Failed to merge cart ${params.cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
