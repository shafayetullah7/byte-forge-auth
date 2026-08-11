import { Injectable, Logger } from '@nestjs/common';
import { mapCartWithItemsToResult } from '../../mappers/cart.mapper';
import { CartQueryService } from './cart.query';
import type { CartResult } from './get-cart.query.types';

@Injectable()
export class GetCartQuery {
  private readonly logger = new Logger(GetCartQuery.name);

  constructor(private readonly cartQueryService: CartQueryService) {}

  async execute(
    cartId: string,
    locale: string = 'en',
  ): Promise<CartResult | null> {
    try {
      const cart = await this.cartQueryService.getCartWithItemsById(cartId);

      if (!cart) {
        return null;
      }

      const variantIds = cart.items.map((item) => item.variantId);
      const inventories =
        await this.cartQueryService.getInventoryByVariantIds(variantIds);

      return mapCartWithItemsToResult(cart, locale, inventories);
    } catch (error) {
      this.logger.error(
        `Failed to get cart ${cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
