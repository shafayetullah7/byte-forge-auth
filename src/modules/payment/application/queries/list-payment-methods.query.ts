import { Injectable } from '@nestjs/common';
import {
  toPaymentMethodResponse,
  type PaymentMethodResponse,
} from '../../mappers/payment-method.mapper';
import { PaymentMethodRepository } from '../../repositories/payment-method.repository';
import type { ListPaymentMethodsQueryDto } from '../../controllers/dto/list-payment-methods-query.dto';

@Injectable()
export class ListPaymentMethodsQuery {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async execute(
    query: ListPaymentMethodsQueryDto,
  ): Promise<PaymentMethodResponse[]> {
    const rows = await this.repository.findAll({
      search: query.search,
      status: query.status,
    });

    return rows.map(toPaymentMethodResponse);
  }
}
