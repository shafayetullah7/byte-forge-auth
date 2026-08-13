export const SubscriptionBillingProviderEnum = {
  NONE: 'NONE',
  COUPON: 'COUPON',
  STRIPE: 'STRIPE',
  ADMIN: 'ADMIN',
  /** Reserved for v2 wallet gateways (bKash/Nagad/SSLCommerz). */
  WALLET: 'WALLET',
} as const;

export type TSubscriptionBillingProvider =
  (typeof SubscriptionBillingProviderEnum)[keyof typeof SubscriptionBillingProviderEnum];
