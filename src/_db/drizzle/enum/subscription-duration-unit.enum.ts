export const SubscriptionDurationUnitEnum = {
  DAY: 'DAY',
  MONTH: 'MONTH',
} as const;

export type TSubscriptionDurationUnit =
  (typeof SubscriptionDurationUnitEnum)[keyof typeof SubscriptionDurationUnitEnum];
