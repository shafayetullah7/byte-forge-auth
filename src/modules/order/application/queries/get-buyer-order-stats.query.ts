import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../repositories/order.repository';

@Injectable()
export class GetBuyerOrderStatsQuery {
  constructor(private readonly orderRepository: OrderRepository) {}

  execute(userId: string) {
    return this.orderRepository.getBuyerOrderStats(userId);
  }
}
