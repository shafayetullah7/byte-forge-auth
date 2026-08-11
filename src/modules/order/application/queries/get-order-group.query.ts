import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '@/_repositories/review/review.repository/review.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { mapBuyerOrderGroupDetail } from '../../mappers/buyer-order-group.mapper';

/** ReviewRepository is a temporary cross-module dependency until ReviewModule exposes ReviewQueryService (Phase 38+). */
@Injectable()
export class GetOrderGroupQuery {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly reviewRepository: ReviewRepository,
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
      await this.reviewRepository.getReviewStatusesForOrderItems(itemIds);

    return mapBuyerOrderGroupDetail(group, lang, userId, reviewByOrderItem);
  }
}
