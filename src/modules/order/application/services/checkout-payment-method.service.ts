import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethodRepository } from '@/_repositories/payment/payment-method.repository';
import type { TPaymentMethod } from '@/_db/drizzle/enum/payment-method.enum';
import type { PaymentMethodWithLogo } from '@/_db/drizzle/schema/payment/payment-methods.schema';

@Injectable()
export class CheckoutPaymentMethodService {
  constructor(
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  /**
   * Resolves a checkout payment key to an active catalog row.
   * The client sends `paymentMethod` (key); server validates against `payment_methods`.
   */
  async resolveActivePaymentMethod(
    key: TPaymentMethod,
  ): Promise<PaymentMethodWithLogo> {
    const method = await this.paymentMethodRepository.findActiveByKey(key);

    if (!method) {
      throw new BadRequestException(
        `Payment method '${key}' is not available. Choose an active payment method.`,
      );
    }

    return method;
  }
}
