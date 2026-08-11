import { Injectable } from '@nestjs/common';
import { BulkUpdateCartCommand } from '@/modules/cart/application/commands';
import type { BulkUpdateCartResult } from '@/modules/cart/application/commands/cart-command.types';
import { BulkUpdateCartItemsDto } from '../dto/bulk-update-items.dto';

export type { BulkUpdateCartResult };
export type { BulkUpdateCartItemResult } from '@/modules/cart/application/commands/cart-command.types';

@Injectable()
export class BulkUpdateCartService {
  constructor(private readonly bulkUpdateCartCommand: BulkUpdateCartCommand) {}

  executeByCartId(
    cartId: string,
    dto: BulkUpdateCartItemsDto,
    locale: string = 'en',
  ): Promise<BulkUpdateCartResult> {
    return this.bulkUpdateCartCommand.execute({
      cartId,
      items: dto.items,
      locale,
    });
  }
}
