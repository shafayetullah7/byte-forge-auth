import { Injectable } from '@nestjs/common';
import { GetOrderGroupQuery } from '@/modules/order/application/queries';

@Injectable()
export class GetOrderGroupService {
  constructor(private readonly getOrderGroupQuery: GetOrderGroupQuery) {}

  execute(userId: string, groupId: string, lang: string = 'en') {
    return this.getOrderGroupQuery.execute(userId, groupId, lang);
  }
}
