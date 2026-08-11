import { Injectable } from '@nestjs/common';
import { GetBuyerOrdersQuery } from '@/modules/order/application/queries';
import { OrdersFilterDto } from '../dto/orders-pagination.dto';

@Injectable()
export class GetOrdersService {
  constructor(private readonly getBuyerOrdersQuery: GetBuyerOrdersQuery) {}

  execute(userId: string, filters: OrdersFilterDto, lang: string = 'en') {
    return this.getBuyerOrdersQuery.execute(userId, filters, lang);
  }
}
