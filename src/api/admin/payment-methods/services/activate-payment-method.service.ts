import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethodRepository } from '@/modules/payment/repositories';
import {
  PaymentMethodResponse,
  toPaymentMethodResponse,
} from '../response/payment-method-response.mapper';

@Injectable()
export class ActivatePaymentMethodService {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async execute(id: string): Promise<PaymentMethodResponse> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Payment method '${id}' not found`);
    }

    if (existing.status === 'ACTIVE') {
      return toPaymentMethodResponse(existing);
    }

    const updated = await this.repository.setStatus(id, 'ACTIVE');

    if (!updated) {
      throw new NotFoundException(`Payment method '${id}' not found`);
    }

    return toPaymentMethodResponse(updated);
  }
}
