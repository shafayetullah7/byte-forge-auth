import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethodRepository } from '@/_repositories/payment/payment-method.repository';
import type { TPaymentMethod } from '@/_db/drizzle/enum/payment-method.enum';

@Injectable()
export class OrderPaymentMethodIntegration {
  constructor(
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async resolveActivePaymentMethod(key: TPaymentMethod) {
    const method = await this.paymentMethodRepository.findActiveByKey(key);

    if (!method) {
      throw new BadRequestException(
        `Payment method '${key}' is not available. Choose an active payment method.`,
      );
    }

    return method;
  }
}
