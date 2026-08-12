import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { CartRepository } from '../../repositories/cart.repository';
import { CartCommandService } from './cart.command';
import type {
  BulkRemoveCartParams,
  BulkRemoveCartResult,
} from './cart-command.types';

@Injectable()
export class BulkRemoveCartCommand {
  private readonly logger = new Logger(BulkRemoveCartCommand.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartCommandService: CartCommandService,
    private readonly db: DrizzleService,
  ) {}

  async execute(params: BulkRemoveCartParams): Promise<BulkRemoveCartResult> {
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

        const notFound: string[] = [];
        let removedCount = 0;

        for (const itemId of params.itemIds) {
          const cartItem = await this.cartRepository.getCartItemById(
            itemId,
            lockTx,
          );

          if (!cartItem || cartItem.cartId !== params.cartId) {
            notFound.push(itemId);
            continue;
          }

          await this.cartCommandService.deleteCartItem(itemId, { tx });
          removedCount++;
        }

        return { removedCount, notFound };
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to bulk remove items from cart ${params.cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
