import { Injectable, Logger } from '@nestjs/common';
import { CartRepository } from '@/modules/cart/repositories';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CustomException } from '@/common/exceptions/custom.exception';
import { BulkRemoveCartItemsDto } from '../dto/bulk-remove-items.dto';

export type BulkRemoveCartResult = {
  removedCount: number;
  notFound: string[];
};

@Injectable()
export class BulkRemoveCartService {
  private readonly logger = new Logger(BulkRemoveCartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly db: DrizzleService,
  ) {}

  async executeByCartId(
    cartId: string,
    dto: BulkRemoveCartItemsDto,
  ): Promise<BulkRemoveCartResult> {
    try {
      return await this.db.transaction(async (tx) => {
        const lockTx = { tx, lock: true };
        const cart = await this.cartRepository.getCartWithItemsById(cartId);

        if (!cart) {
          throw CustomException.notFound({
            message: 'Cart not found',
            details: 'No cart exists',
          });
        }

        const notFound: string[] = [];
        let removedCount = 0;

        for (const itemId of dto.itemIds) {
          const cartItem = await this.cartRepository.getCartItemById(
            itemId,
            lockTx,
          );

          if (!cartItem || cartItem.cartId !== cartId) {
            notFound.push(itemId);
            continue;
          }

          await this.cartRepository.deleteCartItem(itemId, { tx });
          removedCount++;
        }

        return { removedCount, notFound };
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to bulk remove items from cart ${cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
