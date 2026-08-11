import { PaymentMethodEnum } from '@/_db/drizzle/enum/payment-method.enum';
import { PaymentStatusEnum, type TPaymentStatus } from '@/_db/drizzle/enum';
import { PaymentDomainError } from './payment.errors';

const COD_TRANSITIONS: Record<TPaymentStatus, readonly TPaymentStatus[]> = {
  [PaymentStatusEnum.PENDING]: [
    PaymentStatusEnum.PROCESSING,
    PaymentStatusEnum.COMPLETED,
    PaymentStatusEnum.FAILED,
  ],
  [PaymentStatusEnum.PROCESSING]: [
    PaymentStatusEnum.COMPLETED,
    PaymentStatusEnum.FAILED,
  ],
  [PaymentStatusEnum.COMPLETED]: [
    PaymentStatusEnum.REFUNDED,
    PaymentStatusEnum.PARTIALLY_REFUNDED,
  ],
  [PaymentStatusEnum.FAILED]: [],
  [PaymentStatusEnum.REFUNDED]: [],
  [PaymentStatusEnum.PARTIALLY_REFUNDED]: [PaymentStatusEnum.REFUNDED],
};

export function assertPaymentTransition(
  current: TPaymentStatus,
  next: TPaymentStatus,
): void {
  if (current === next) {
    throw new PaymentDomainError(`Payment is already ${next}`);
  }

  const allowed = COD_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new PaymentDomainError(
      `Cannot transition payment from ${current} to ${next}`,
    );
  }
}

export function isCodMethod(method: string): boolean {
  return method === PaymentMethodEnum.COD;
}
