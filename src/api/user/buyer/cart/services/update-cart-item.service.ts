import { Injectable } from '@nestjs/common';
import { UpdateCartItemCommand } from '@/modules/cart/application/commands';
import type { UpdateCartItemResult } from '@/modules/cart/application/commands/cart-command.types';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';

export type { UpdateCartItemResult };

@Injectable()
export class UpdateCartItemService {
  constructor(private readonly updateCartItemCommand: UpdateCartItemCommand) {}

  executeByCartIdAndItem(
    cartId: string,
    itemId: string,
    dto: UpdateCartItemDto,
    locale: string = 'en',
  ): Promise<UpdateCartItemResult> {
    return this.updateCartItemCommand.execute({
      cartId,
      itemId,
      quantity: dto.quantity,
      locale,
    });
  }
}
