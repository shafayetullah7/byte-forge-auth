import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { CartQueryService } from '../queries/cart.query';
import { CartCommandService } from './cart.command';

@Injectable()
export class ClearCartCommand {
  private readonly logger = new Logger(ClearCartCommand.name);

  constructor(
    private readonly cartQueryService: CartQueryService,
    private readonly cartCommandService: CartCommandService,
    private readonly db: DrizzleService,
  ) {}

  async execute(cartId: string): Promise<void> {
    try {
      return await this.db.transaction(async (tx) => {
        const cart = await this.cartQueryService.getCartWithItemsById(cartId);

        if (!cart) {
          throw CustomException.notFound({
            message: 'Cart not found',
            details: 'No cart exists',
          });
        }

        await this.cartCommandService.deleteAllCartItems(cartId, { tx });
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
