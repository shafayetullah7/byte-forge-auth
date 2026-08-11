import { Injectable } from '@nestjs/common';
import { RemoveCartItemCommand } from '@/modules/cart/application/commands';

@Injectable()
export class RemoveCartItemService {
  constructor(private readonly removeCartItemCommand: RemoveCartItemCommand) {}

  executeByCartIdAndItem(cartId: string, itemId: string): Promise<void> {
    return this.removeCartItemCommand.execute(cartId, itemId);
  }
}
