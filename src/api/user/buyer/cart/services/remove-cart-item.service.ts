import { Injectable, Logger } from '@nestjs/common';
import { CartRepository } from '@/modules/cart/repositories';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CustomException } from '@/common/exceptions/custom.exception';

@Injectable()
export class RemoveCartItemService {
  private readonly logger = new Logger(RemoveCartItemService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly db: DrizzleService,
  ) {}

  async executeByCartIdAndItem(cartId: string, itemId: string): Promise<void> {
    try {
      return await this.db.transaction(async (tx) => {
        const lockTx = { tx, lock: true };
        const cartItem = await this.cartRepository.getCartItemById(
          itemId,
          lockTx,
        );

        if (!cartItem || cartItem.cartId !== cartId) {
          throw CustomException.notFound({
            message: 'Cart item not found',
            details: `Item ID: ${itemId}`,
          });
        }

        await this.cartRepository.deleteCartItem(itemId, { tx });
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to remove cart item ${itemId} from cart ${cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
