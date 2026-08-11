import { PaymentStatusEnum, type TPaymentStatus } from '@/_db/drizzle/enum';
import type { TPaymentMethod } from '@/_db/drizzle/enum/payment-method.enum';
import { assertPaymentTransition, isCodMethod } from './payment-policy';
import { PaymentDomainError } from './payment.errors';

export interface PaymentEntityProps {
  id: string;
  orderId: string;
  amount: string;
  currency: string;
  method: TPaymentMethod;
  status: TPaymentStatus;
  transactionId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  readonly id: string;
  readonly orderId: string;
  readonly amount: string;
  readonly currency: string;
  readonly method: TPaymentMethod;
  status: TPaymentStatus;
  transactionId: string | null;
  paidAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: PaymentEntityProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.method = props.method;
    this.status = props.status;
    this.transactionId = props.transactionId;
    this.paidAt = props.paidAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isCod(): boolean {
    return isCodMethod(this.method);
  }

  markCodCollected(): void {
    if (!this.isCod()) {
      throw new PaymentDomainError(
        'Only COD payments can be marked collected via cash on delivery',
      );
    }
    this.transitionTo(PaymentStatusEnum.COMPLETED);
    this.paidAt = new Date();
  }

  markFailed(): void {
    this.transitionTo(PaymentStatusEnum.FAILED);
  }

  markRefunded(): void {
    this.transitionTo(PaymentStatusEnum.REFUNDED);
  }

  markPartiallyRefunded(): void {
    this.transitionTo(PaymentStatusEnum.PARTIALLY_REFUNDED);
  }

  private transitionTo(nextStatus: TPaymentStatus): void {
    assertPaymentTransition(this.status, nextStatus);
    this.status = nextStatus;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
