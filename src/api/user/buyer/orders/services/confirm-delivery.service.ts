import { Injectable } from '@nestjs/common';
import { ConfirmDeliveryCommand } from '@/modules/order/application/commands';

@Injectable()
export class ConfirmDeliveryService {
  constructor(
    private readonly confirmDeliveryCommand: ConfirmDeliveryCommand,
  ) {}

  execute(userId: string, orderId: string) {
    return this.confirmDeliveryCommand.execute(userId, orderId);
  }
}
