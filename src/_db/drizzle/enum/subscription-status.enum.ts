export const SubscriptionStatusEnum = {
  NONE: 'NONE',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
} as const;

export type TSubscriptionStatus =
  (typeof SubscriptionStatusEnum)[keyof typeof SubscriptionStatusEnum];
