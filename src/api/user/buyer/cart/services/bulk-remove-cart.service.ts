import { Injectable } from '@nestjs/common';
import { BulkRemoveCartCommand } from '@/modules/cart/application/commands';
import type { BulkRemoveCartResult } from '@/modules/cart/application/commands/cart-command.types';
import { BulkRemoveCartItemsDto } from '../dto/bulk-remove-items.dto';

export type { BulkRemoveCartResult };

@Injectable()
export class BulkRemoveCartService {
  constructor(private readonly bulkRemoveCartCommand: BulkRemoveCartCommand) {}

  executeByCartId(
    cartId: string,
    dto: BulkRemoveCartItemsDto,
  ): Promise<BulkRemoveCartResult> {
    return this.bulkRemoveCartCommand.execute({
      cartId,
      itemIds: dto.itemIds,
    });
  }
}
