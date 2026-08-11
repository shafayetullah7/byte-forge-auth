import { Injectable, NotFoundException } from '@nestjs/common';
import {
  toPaymentMethodResponse,
  type PaymentMethodResponse,
} from '../../mappers/payment-method.mapper';
import { PaymentMethodRepository } from '../../repositories/payment-method.repository';

@Injectable()
export class GetPaymentMethodQuery {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async execute(id: string): Promise<PaymentMethodResponse> {
    const row = await this.repository.findById(id);

    if (!row) {
      throw new NotFoundException(`Payment method '${id}' not found`);
    }

    return toPaymentMethodResponse(row);
  }
}
