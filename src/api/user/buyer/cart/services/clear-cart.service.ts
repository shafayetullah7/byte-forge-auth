import { Injectable, Logger } from '@nestjs/common';
import { CartRepository } from '@/modules/cart/repositories';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CustomException } from '@/common/exceptions/custom.exception';

@Injectable()
export class ClearCartService {
  private readonly logger = new Logger(ClearCartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly db: DrizzleService,
  ) {}

  async executeByCartId(cartId: string): Promise<void> {
    try {
      return await this.db.transaction(async (tx) => {
        const cart = await this.cartRepository.getCartWithItemsById(cartId);

        if (!cart) {
          throw CustomException.notFound({
            message: 'Cart not found',
            details: 'No cart exists',
          });
        }

        await this.cartRepository.deleteAllCartItems(cartId, { tx });
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to clear cart ${cartId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
