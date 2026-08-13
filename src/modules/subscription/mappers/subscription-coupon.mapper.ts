import type { TSubscriptionCoupon } from '@/_db/drizzle/schema/subscription/subscription-coupons.schema';
import { SubscriptionDurationUnitEnum } from '@/_db/drizzle/enum/subscription-duration-unit.enum';

export type SubscriptionCouponResponse = {
  id: string;
  code: string;
  durationValue: number;
  durationUnit: string;
  maxRedemptions: number | null;
  redemptionCount: number;
  redemptionsRemaining: number | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export function toSubscriptionCouponResponse(
  row: TSubscriptionCoupon,
): SubscriptionCouponResponse {
  const redemptionsRemaining =
    row.maxRedemptions === null
      ? null
      : Math.max(0, row.maxRedemptions - row.redemptionCount);

  return {
    id: row.id,
    code: row.code,
    durationValue: row.durationValue,
    durationUnit: row.durationUnit,
    maxRedemptions: row.maxRedemptions,
    redemptionCount: row.redemptionCount,
    redemptionsRemaining,
    validFrom: row.validFrom?.toISOString() ?? null,
    validUntil: row.validUntil?.toISOString() ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const SUBSCRIPTION_COUPON_DURATION_UNITS = Object.values(
  SubscriptionDurationUnitEnum,
);
