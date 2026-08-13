export const SubscriptionInvoiceStatusEnum = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  VOID: 'VOID',
} as const;

export type TSubscriptionInvoiceStatus =
  (typeof SubscriptionInvoiceStatusEnum)[keyof typeof SubscriptionInvoiceStatusEnum];
