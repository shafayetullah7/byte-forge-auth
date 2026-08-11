import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethodRepository } from '@/modules/payment/repositories';
import {
  PaymentMethodResponse,
  toPaymentMethodResponse,
} from '../response/payment-method-response.mapper';

@Injectable()
export class DeactivatePaymentMethodService {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async execute(id: string): Promise<PaymentMethodResponse> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Payment method '${id}' not found`);
    }

    if (existing.status === 'INACTIVE') {
      return toPaymentMethodResponse(existing);
    }

    const activeCount = await this.repository.countActive();

    if (activeCount <= 1) {
      throw new BadRequestException(
        'Cannot deactivate the only active payment method. At least one method must remain active for checkout.',
      );
    }

    const updated = await this.repository.setStatus(id, 'INACTIVE');

    if (!updated) {
      throw new NotFoundException(`Payment method '${id}' not found`);
    }

    return toPaymentMethodResponse(updated);
  }
}
