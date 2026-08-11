import { Injectable } from '@nestjs/common';
import type { TAuthorizedShop } from '@/common/types';
import { GetSellerOrderQuery } from '@/modules/order/application/queries';

@Injectable()
export class GetSellerOrderService {
  constructor(private readonly getSellerOrderQuery: GetSellerOrderQuery) {}

  execute(shop: TAuthorizedShop, orderId: string, lang: string) {
    return this.getSellerOrderQuery.execute(shop, orderId, lang);
  }
}
