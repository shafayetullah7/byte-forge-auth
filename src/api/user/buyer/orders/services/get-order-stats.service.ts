import { Injectable } from '@nestjs/common';
import { GetBuyerOrderStatsQuery } from '@/modules/order/application/queries';

@Injectable()
export class GetOrderStatsService {
  constructor(
    private readonly getBuyerOrderStatsQuery: GetBuyerOrderStatsQuery,
  ) {}

  execute(userId: string) {
    return this.getBuyerOrderStatsQuery.execute(userId);
  }
}
