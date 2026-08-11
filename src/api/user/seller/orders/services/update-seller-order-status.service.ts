import { Injectable } from '@nestjs/common';
import { UpdateSellerOrderStatusCommand } from '@/modules/order/application/commands';
import type { TAuthorizedShop } from '@/common/types';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';

@Injectable()
export class UpdateSellerOrderStatusService {
  constructor(
    private readonly updateSellerOrderStatusCommand: UpdateSellerOrderStatusCommand,
  ) {}

  execute(
    shop: TAuthorizedShop,
    orderId: string,
    sellerUserId: string,
    dto: UpdateOrderStatusDto,
    lang: string,
  ) {
    return this.updateSellerOrderStatusCommand.execute(
      shop,
      orderId,
      sellerUserId,
      {
        status: dto.status,
        notes: dto.notes,
        expectedUpdatedAt: dto.expectedUpdatedAt,
      },
      lang,
    );
  }
}
