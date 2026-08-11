import type { TPayment } from '@/_db/drizzle/schema/payment/payments.schema';
import { Payment } from '../domain/payment.entity';
import type { PaymentEntityProps } from '../domain/payment.entity';

export function mapPaymentRowToEntity(row: TPayment): Payment {
  return new Payment({
    id: row.id,
    orderId: row.orderId,
    amount: row.amount,
    currency: row.currency,
    method: row.method,
    status: row.status,
    transactionId: row.transactionId,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function mapPaymentEntityToUpdatePatch(
  payment: Payment,
): Pick<TPayment, 'status' | 'transactionId' | 'paidAt' | 'updatedAt'> {
  return {
    status: payment.status,
    transactionId: payment.transactionId,
    paidAt: payment.paidAt,
    updatedAt: payment.updatedAt,
  };
}

export function mapPaymentEntityToInsert(
  props: PaymentEntityProps,
): Omit<TPayment, 'gatewayResponse'> & { gatewayResponse?: null } {
  return {
    id: props.id,
    orderId: props.orderId,
    amount: props.amount,
    currency: props.currency,
    method: props.method,
    status: props.status,
    transactionId: props.transactionId,
    gatewayResponse: null,
    paidAt: props.paidAt,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  };
}
