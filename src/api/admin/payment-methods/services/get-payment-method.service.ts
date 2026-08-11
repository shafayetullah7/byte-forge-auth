import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethodRepository } from '@/modules/payment/repositories';
import {
  PaymentMethodResponse,
  toPaymentMethodResponse,
} from '../response/payment-method-response.mapper';

@Injectable()
export class GetPaymentMethodService {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async execute(id: string): Promise<PaymentMethodResponse> {
    const row = await this.repository.findById(id);

    if (!row) {
      throw new NotFoundException(`Payment method '${id}' not found`);
    }

    return toPaymentMethodResponse(row);
  }
}
