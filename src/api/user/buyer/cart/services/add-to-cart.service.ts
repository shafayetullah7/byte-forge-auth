import { Injectable } from '@nestjs/common';
import { AddToCartCommand } from '@/modules/cart/application/commands';
import type { AddToCartResult } from '@/modules/cart/application/commands/cart-command.types';
import { AddToCartDto } from '../dto/add-to-cart.dto';

export type { AddToCartResult };

@Injectable()
export class AddToCartService {
  constructor(private readonly addToCartCommand: AddToCartCommand) {}

  executeByCartId(
    cartId: string,
    dto: AddToCartDto,
    locale: string = 'en',
  ): Promise<AddToCartResult> {
    return this.addToCartCommand.execute({
      cartId,
      variantId: dto.variantId,
      quantity: dto.quantity,
      locale,
    });
  }
}
