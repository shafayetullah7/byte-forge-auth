import { Injectable } from '@nestjs/common';
import { CancelSellerOrderCommand } from '@/modules/order/application/commands';
import type { TAuthorizedShop } from '@/common/types';
import { CancelSellerOrderDto } from '../dto/cancel-order.dto';

@Injectable()
export class CancelSellerOrderService {
  constructor(
    private readonly cancelSellerOrderCommand: CancelSellerOrderCommand,
  ) {}

  execute(
    shop: TAuthorizedShop,
    orderId: string,
    sellerUserId: string,
    dto: CancelSellerOrderDto,
    lang: string,
  ) {
    return this.cancelSellerOrderCommand.execute(
      shop,
      orderId,
      sellerUserId,
      {
        reason: dto.reason,
        expectedUpdatedAt: dto.expectedUpdatedAt,
      },
      lang,
    );
  }
}
