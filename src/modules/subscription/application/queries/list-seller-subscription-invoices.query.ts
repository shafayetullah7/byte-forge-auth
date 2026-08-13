import { Injectable } from '@nestjs/common';
import { paginate } from '@/libs/utils/pagination.util';
import type { PaginatedResult } from '@/libs/types/pagination.type';
import type { ListSellerSubscriptionInvoicesQueryDto } from '../../controllers/dto/list-seller-subscription-invoices-query.dto';
import {
  toSubscriptionInvoiceSummary,
  type SubscriptionInvoiceSummary,
} from '../../mappers/shop-subscription.mapper';
import { SubscriptionInvoiceRepository } from '../../repositories/subscription-invoice.repository';

@Injectable()
export class ListSellerSubscriptionInvoicesQuery {
  constructor(
    private readonly subscriptionInvoiceRepository: SubscriptionInvoiceRepository,
  ) {}

  async execute(
    shopId: string,
    query: ListSellerSubscriptionInvoicesQueryDto,
  ): Promise<PaginatedResult<SubscriptionInvoiceSummary>> {
    const { page, limit } = query;
    const { rows, total } =
      await this.subscriptionInvoiceRepository.listByShopIdPaginated(
        shopId,
        page,
        limit,
      );

    return paginate(
      rows.map(toSubscriptionInvoiceSummary),
      total,
      page,
      limit,
    );
  }
}
