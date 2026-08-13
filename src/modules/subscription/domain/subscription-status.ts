/**
 * Domain subscription status values. String values match `SubscriptionStatusEnum`
 * in Drizzle so repositories can map rows without conversion beyond casting.
 */
export const SubscriptionStatus = {
  NONE: 'NONE',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
