import { Injectable } from '@nestjs/common';
import { ClearCartCommand } from '@/modules/cart/application/commands';

@Injectable()
export class ClearCartService {
  constructor(private readonly clearCartCommand: ClearCartCommand) {}

  executeByCartId(cartId: string): Promise<void> {
    return this.clearCartCommand.execute(cartId);
  }
}
