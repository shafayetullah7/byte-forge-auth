import { Injectable } from '@nestjs/common';
import { ValidateCartQuery } from '@/modules/cart/application/queries';

export type {
  ValidateCartResult,
  ValidateIssue,
} from '@/modules/cart/application/queries/validate-cart.query.types';

@Injectable()
export class ValidateCartService {
  constructor(private readonly validateCartQuery: ValidateCartQuery) {}

  executeByCartId(cartId: string, locale: string = 'en') {
    return this.validateCartQuery.execute(cartId, locale);
  }
}
