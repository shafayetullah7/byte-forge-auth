import { Injectable } from '@nestjs/common';
import { ShipSellerOrderCommand } from '@/modules/order/application/commands';
import type { TAuthorizedShop } from '@/common/types';
import { ShipOrderDto } from '../dto/ship-order.dto';

@Injectable()
export class ShipSellerOrderService {
  constructor(
    private readonly shipSellerOrderCommand: ShipSellerOrderCommand,
  ) {}

  execute(
    shop: TAuthorizedShop,
    orderId: string,
    sellerUserId: string,
    dto: ShipOrderDto,
    lang: string,
  ) {
    return this.shipSellerOrderCommand.execute(
      shop,
      orderId,
      sellerUserId,
      {
        carrier: dto.carrier,
        trackingNumber: dto.trackingNumber,
        shippingMethod: dto.shippingMethod,
        estimatedDelivery: dto.estimatedDelivery,
        notes: dto.notes,
        expectedUpdatedAt: dto.expectedUpdatedAt,
      },
      lang,
    );
  }
}
