import { Injectable } from '@nestjs/common';
import {
  toPublicPaymentMethodResponse,
  type PublicPaymentMethodResponse,
} from '../../mappers/payment-method.mapper';
import { PaymentMethodRepository } from '../../repositories/payment-method.repository';

@Injectable()
export class ListActivePaymentMethodsQuery {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async execute(): Promise<PublicPaymentMethodResponse[]> {
    const rows = await this.repository.findAll({ status: 'ACTIVE' });
    return rows.map(toPublicPaymentMethodResponse);
  }
}
