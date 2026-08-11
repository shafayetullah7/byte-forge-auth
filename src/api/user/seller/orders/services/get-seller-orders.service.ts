import { Injectable } from '@nestjs/common';
import { ListSellerOrdersQuery } from '@/modules/order/application/queries';
import { SellerOrdersFilterDto } from '../dto/seller-orders-filter.dto';

@Injectable()
export class GetSellerOrdersService {
  constructor(private readonly listSellerOrdersQuery: ListSellerOrdersQuery) {}

  execute(shopId: string, filters: SellerOrdersFilterDto, lang: string) {
    return this.listSellerOrdersQuery.execute(shopId, filters, lang);
  }
}
