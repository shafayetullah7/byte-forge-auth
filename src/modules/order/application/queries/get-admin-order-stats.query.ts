import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../repositories/order.repository';
import type { AdminOrderStatsFilterParams } from './query.params';

@Injectable()
export class GetAdminOrderStatsQuery {
  constructor(private readonly orderRepository: OrderRepository) {}

  execute(query: AdminOrderStatsFilterParams) {
    return this.orderRepository.getAdminOrderStats({
      shopId: query.shopId,
      userId: query.userId,
    });
  }
}
