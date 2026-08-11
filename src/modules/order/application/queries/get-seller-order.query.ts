import { Injectable, NotFoundException } from '@nestjs/common';
import type { TAuthorizedShop } from '@/common/types';
import {
  buildMapSellerOrderContext,
  mapSellerOrder,
} from '../../mappers/seller-orders.mapper';
import { OrderRepository } from '../../repositories/order.repository';

@Injectable()
export class GetSellerOrderQuery {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(shop: TAuthorizedShop, orderId: string, lang: string) {
    const order = await this.orderRepository.getSellerOrderDetail(
      orderId,
      shop.id,
      lang,
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return mapSellerOrder(order, lang, buildMapSellerOrderContext(shop, lang));
  }
}
