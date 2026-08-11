import { Injectable } from '@nestjs/common';
import { PaymentMethodRepository } from '@/modules/payment/repositories';
import { ListPaymentMethodsQueryDto } from '../dto/list-payment-methods-query.dto';
import {
  PaymentMethodResponse,
  toPaymentMethodResponse,
} from '../response/payment-method-response.mapper';

@Injectable()
export class ListPaymentMethodsService {
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
