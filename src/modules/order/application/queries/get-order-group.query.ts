import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderReviewIntegration } from '@/libs/integrations/order';
import { CatalogQueryService } from '@/modules/catalog/application/queries';
import { OrderRepository } from '../../repositories/order.repository';
import { mapBuyerOrderGroupDetail } from '../../mappers/buyer-order-group.mapper';
import {
  collectProductIdsFromOrders,
  loadProductSummaries,
} from '../utils/load-product-summaries';

@Injectable()
export class GetOrderGroupQuery {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly reviewIntegration: OrderReviewIntegration,
    private readonly catalogQueryService: CatalogQueryService,
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

    const productSummaries = await loadProductSummaries(
      this.catalogQueryService,
      collectProductIdsFromOrders(group.orders),
      lang,
    );

    return mapBuyerOrderGroupDetail(
      group,
      lang,
      userId,
      reviewByOrderItem,
      productSummaries,
    );
  }
}
