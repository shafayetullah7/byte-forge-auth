import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../repositories/order.repository';

@Injectable()
export class GetSellerOrderStatsQuery {
  constructor(private readonly orderRepository: OrderRepository) {}

  execute(shopId: string) {
    return this.orderRepository.getSellerOrderStats(shopId);
  }
}
