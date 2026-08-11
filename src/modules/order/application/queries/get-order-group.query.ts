import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderReviewIntegration } from '@/common/integrations/order';
import { OrderRepository } from '../../repositories/order.repository';
import { mapBuyerOrderGroupDetail } from '../../mappers/buyer-order-group.mapper';

@Injectable()
export class GetOrderGroupQuery {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly reviewIntegration: OrderReviewIntegration,
  ) {}

  async execute(userId: string, groupId: string, lang: string = 'en') {
    const group = await this.orderRepository.getBuyerOrderGroupWithDetails(
      groupId,
      userId,
      lang,
    );

    if (!group) {
      throw new NotFoundException('Order group not found');
    }

    const itemIds = group.orders.flatMap((order) =>
      order.items.map((item) => item.id),
    );
    const reviewByOrderItem =
      await this.reviewIntegration.getReviewStatusesForOrderItems(itemIds);

    return mapBuyerOrderGroupDetail(group, lang, userId, reviewByOrderItem);
  }
}
