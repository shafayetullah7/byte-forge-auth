export const SubscriptionDurationUnit = {
  DAY: 'DAY',
  MONTH: 'MONTH',
} as const;

export type SubscriptionDurationUnit =
  (typeof SubscriptionDurationUnit)[keyof typeof SubscriptionDurationUnit];
