import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { CartRepository } from '../../repositories/cart.repository';

@Injectable()
export class RemoveCartItemCommand {
  private readonly logger = new Logger(RemoveCartItemCommand.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly db: DrizzleService,
  ) {}

  async execute(cartId: string, itemId: string): Promise<void> {
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
