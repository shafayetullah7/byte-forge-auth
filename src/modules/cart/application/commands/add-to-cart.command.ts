import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CustomException } from '@/common/exceptions/custom.exception';
import {
  assertSufficientStock,
  assertVariantAvailableForPurchase,
  assertVariantExists,
  getAvailableQuantity,
} from '../assert-cart-variant.util';
import { mapVariantRowToCartItemResult } from '../../mappers/cart.mapper';
import { CartRepository } from '../../repositories/cart.repository';
import type { AddToCartParams, AddToCartResult } from './cart-command.types';

@Injectable()
export class AddToCartCommand {
  private readonly logger = new Logger(AddToCartCommand.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly db: DrizzleService,
  ) {}

  async execute(params: AddToCartParams): Promise<AddToCartResult> {
    const locale = params.locale ?? 'en';

    try {
      return await this.db.transaction(async (tx) => {
        const lockTx = { tx, lock: true };

        const variant = await this.cartRepository.getVariantForCartOperation(
          params.variantId,
        );
        assertVariantExists(variant, params.variantId);
        assertVariantAvailableForPurchase(variant);

        const inventory =
          (await this.cartRepository.getInventoryByVariantIdLocked(
            params.variantId,
            lockTx,
          )) ?? null;

        assertSufficientStock(inventory, params.quantity);

        const existingItem = await this.cartRepository.getCartItem(
          params.cartId,
          params.variantId,
          lockTx,
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + params.quantity;
          const available = getAvailableQuantity(inventory);
          assertSufficientStock(inventory, newQuantity, {
            message: 'Insufficient stock for updated quantity',
            details: `Only ${available ?? 0} items available. Current in cart: ${existingItem.quantity}, adding: ${params.quantity}`,
          });

          const updatedItem = await this.cartRepository.updateCartItem(
            existingItem.id,
            { quantity: newQuantity },
            lockTx,
          );

          return mapVariantRowToCartItemResult(
            updatedItem,
            variant,
            inventory,
            locale,
          );
        }

        const newItem = await this.cartRepository.createCartItem(
          {
            cartId: params.cartId,
            variantId: params.variantId,
            quantity: params.quantity,
          },
          { tx },
        );

        return mapVariantRowToCartItemResult(
          newItem,
          variant,
          inventory,
          locale,
        );
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to add item to cart ${params.cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
