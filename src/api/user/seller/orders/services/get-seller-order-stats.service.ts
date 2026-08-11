import { Injectable } from '@nestjs/common';
import { GetSellerOrderStatsQuery } from '@/modules/order/application/queries';

@Injectable()
export class GetSellerOrderStatsService {
  constructor(
    private readonly getSellerOrderStatsQuery: GetSellerOrderStatsQuery,
  ) {}

  execute(shopId: string) {
    return this.getSellerOrderStatsQuery.execute(shopId);
  }
}
