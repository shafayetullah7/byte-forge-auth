import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogQueryService } from '@/modules/catalog/application/queries';
import { UserQueryService } from '@/modules/user/application/queries/user.query';
import { mapAdminOrderDetail } from '../../mappers/admin-orders.mapper';
import { OrderRepository } from '../../repositories/order.repository';
import { loadProductSummaries } from '../utils/load-product-summaries';
import { loadUserSummaries } from '../utils/load-user-summaries';

@Injectable()
export class GetAdminOrderQuery {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogQueryService: CatalogQueryService,
    private readonly userQueryService: UserQueryService,
  ) {}

  async execute(orderId: string, lang: string) {
    const order = await this.orderRepository.getAdminOrderDetail(orderId, lang);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const [productSummaries, userSummaries] = await Promise.all([
      loadProductSummaries(
        this.catalogQueryService,
        order.items.map((item) => item.productId),
        lang,
      ),
      loadUserSummaries(this.userQueryService, [order.userId]),
    ]);

    return mapAdminOrderDetail(order, lang, productSummaries, userSummaries);
  }
}
