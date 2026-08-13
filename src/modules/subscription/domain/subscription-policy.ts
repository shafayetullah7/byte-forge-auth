import { SubscriptionDurationUnit } from './subscription-duration';
import { SubscriptionDomainError } from './subscription.errors';
import { SubscriptionStatus } from './subscription-status';

export function computeStatus(
  periodEnd: Date | null | undefined,
  now: Date = new Date(),
): SubscriptionStatus {
  if (!periodEnd) {
    return SubscriptionStatus.NONE;
  }
  return now.getTime() < periodEnd.getTime()
    ? SubscriptionStatus.ACTIVE
    : SubscriptionStatus.EXPIRED;
}

export function isEntitlementActive(
  periodEnd: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  return computeStatus(periodEnd, now) === SubscriptionStatus.ACTIVE;
}

/**
 * Extends subscription from the later of `currentPeriodEnd` or `now`.
 * Uses calendar months/days (not fixed 30-day months).
 */
export function extendPeriod(
  currentPeriodEnd: Date | null | undefined,
  durationValue: number,
  unit: SubscriptionDurationUnit,
  now: Date = new Date(),
): Date {
  if (!Number.isFinite(durationValue) || durationValue <= 0) {
    throw new SubscriptionDomainError('Duration must be a positive number');
  }

  const baseMs = Math.max(
    currentPeriodEnd?.getTime() ?? Number.NEGATIVE_INFINITY,
    now.getTime(),
  );
  const base = new Date(baseMs);

  if (unit === SubscriptionDurationUnit.DAY) {
    return addCalendarDays(base, durationValue);
  }
  if (unit === SubscriptionDurationUnit.MONTH) {
    return addCalendarMonths(base, durationValue);
  }

  throw new SubscriptionDomainError(`Unsupported duration unit: ${unit}`);
}

/** Rejects coupon redeem while an active paid period is still in effect. */
export function assertCanRedeemCoupon(
  currentPeriodEnd: Date | null | undefined,
  now: Date = new Date(),
): void {
  if (isEntitlementActive(currentPeriodEnd, now)) {
    throw new SubscriptionDomainError(
      `Subscription is already active until ${currentPeriodEnd!.toISOString()}`,
    );
  }
}

function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Calendar months with end-of-month clamping (e.g. Jan 31 + 1 → Feb 28/29). */
function addCalendarMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const targetMonthIndex = month + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDayOfTargetMonth)),
  );
}
