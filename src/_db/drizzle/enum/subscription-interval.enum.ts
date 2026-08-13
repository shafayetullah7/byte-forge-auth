export const SubscriptionIntervalEnum = {
  MONTH: 'MONTH',
  YEAR: 'YEAR',
} as const;

export type TSubscriptionInterval =
  (typeof SubscriptionIntervalEnum)[keyof typeof SubscriptionIntervalEnum];
