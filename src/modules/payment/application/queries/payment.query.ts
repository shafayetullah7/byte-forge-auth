import { BadRequestException, Injectable } from '@nestjs/common';
import type { TPaymentMethod } from '@/_db/drizzle/enum/payment-method.enum';
import { PaymentMethodRepository } from '../../repositories/payment-method.repository';

/**
 * Cross-module read facade for checkout and other callers outside HTTP controllers.
 */
@Injectable()
export class PaymentQueryService {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async resolveActivePaymentMethod(key: TPaymentMethod) {
    const method = await this.repository.findActiveByKey(key);

    if (!method) {
      throw new BadRequestException(
        `Payment method '${key}' is not available. Choose an active payment method.`,
      );
    }

    return method;
  }
}
