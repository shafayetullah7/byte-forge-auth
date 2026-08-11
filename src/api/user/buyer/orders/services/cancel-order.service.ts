import { Injectable } from '@nestjs/common';
import { CancelBuyerOrderCommand } from '@/modules/order/application/commands';

@Injectable()
export class CancelOrderService {
  constructor(
    private readonly cancelBuyerOrderCommand: CancelBuyerOrderCommand,
  ) {}

  execute(userId: string, orderId: string, reason?: string) {
    return this.cancelBuyerOrderCommand.execute(userId, orderId, reason);
  }
}
