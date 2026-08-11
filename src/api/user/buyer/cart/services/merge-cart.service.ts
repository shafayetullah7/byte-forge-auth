import { Injectable } from '@nestjs/common';
import { MergeCartCommand } from '@/modules/cart/application/commands';
import type { MergeCartResult } from '@/modules/cart/application/commands/cart-command.types';
import { MergeCartDto } from '../dto/merge-cart.dto';

export type { MergeCartResult };

@Injectable()
export class MergeCartService {
  constructor(private readonly mergeCartCommand: MergeCartCommand) {}

  executeByCartId(
    cartId: string,
    dto: MergeCartDto,
    locale: string = 'en',
  ): Promise<MergeCartResult> {
    return this.mergeCartCommand.execute({
      cartId,
      guestItems: dto.guestItems,
      locale,
    });
  }
}
