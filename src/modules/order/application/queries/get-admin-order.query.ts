import { Injectable, NotFoundException } from '@nestjs/common';
import { mapAdminOrderDetail } from '@/api/admin/orders/admin-orders.mapper';
import { OrderRepository } from '../../repositories/order.repository';

@Injectable()
export class GetAdminOrderQuery {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(orderId: string, lang: string) {
    const order = await this.orderRepository.getAdminOrderDetail(orderId, lang);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return mapAdminOrderDetail(order, lang);
  }
}
