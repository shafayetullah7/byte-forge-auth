import { Injectable } from '@nestjs/common';
import { GetCartQuery } from '@/modules/cart/application/queries';

export type {
  CartItemResult,
  CartResult,
} from '@/modules/cart/application/queries/get-cart.query.types';

@Injectable()
export class GetCartService {
  constructor(private readonly getCartQuery: GetCartQuery) {}

  executeByCartId(cartId: string, locale: string = 'en') {
    return this.getCartQuery.execute(cartId, locale);
  }
}
