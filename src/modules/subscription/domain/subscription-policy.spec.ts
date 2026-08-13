import {
  assertCanRedeemCoupon,
  assertCouponDefinitionValid,
  computeStatus,
  extendPeriod,
  isEntitlementActive,
} from './subscription-policy';
import { SubscriptionDurationUnit } from './subscription-duration';
import { SubscriptionDomainError } from './subscription.errors';
import { SubscriptionStatus } from './subscription-status';

describe('subscription-policy', () => {
  const jan31_2026 = new Date('2026-01-31T12:00:00.000Z');
  const feb15_2026 = new Date('2026-02-15T12:00:00.000Z');
  const mar1_2026 = new Date('2026-03-01T12:00:00.000Z');

  describe('computeStatus', () => {
    it('returns NONE when period end is missing', () => {
      expect(computeStatus(null, jan31_2026)).toBe(SubscriptionStatus.NONE);
      expect(computeStatus(undefined, jan31_2026)).toBe(SubscriptionStatus.NONE);
    });

    it('returns ACTIVE before period end', () => {
      expect(computeStatus(mar1_2026, feb15_2026)).toBe(
        SubscriptionStatus.ACTIVE,
      );
    });

    it('returns EXPIRED on or after period end', () => {
      expect(computeStatus(feb15_2026, feb15_2026)).toBe(
        SubscriptionStatus.EXPIRED,
      );
      expect(computeStatus(feb15_2026, mar1_2026)).toBe(
        SubscriptionStatus.EXPIRED,
      );
    });
  });

  describe('isEntitlementActive', () => {
    it('mirrors ACTIVE status', () => {
      expect(isEntitlementActive(mar1_2026, feb15_2026)).toBe(true);
      expect(isEntitlementActive(feb15_2026, mar1_2026)).toBe(false);
    });
  });

  describe('extendPeriod', () => {
    it('extends from now when there is no current period', () => {
      const now = new Date('2026-06-01T00:00:00.000Z');
      const result = extendPeriod(null, 14, SubscriptionDurationUnit.DAY, now);
      expect(result.toISOString()).toBe('2026-06-15T00:00:00.000Z');
    });

    it('extends from current period end when it is in the future', () => {
      const now = new Date('2026-06-01T00:00:00.000Z');
      const currentEnd = new Date('2026-09-01T00:00:00.000Z');
      const result = extendPeriod(
        currentEnd,
        1,
        SubscriptionDurationUnit.MONTH,
        now,
      );
      expect(result.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    });

    it('extends from now when current period is in the past', () => {
      const now = new Date('2026-06-01T00:00:00.000Z');
      const currentEnd = new Date('2026-01-01T00:00:00.000Z');
      const result = extendPeriod(
        currentEnd,
        7,
        SubscriptionDurationUnit.DAY,
        now,
      );
      expect(result.toISOString()).toBe('2026-06-08T00:00:00.000Z');
    });

    it('clamps month addition at end of month', () => {
      const result = extendPeriod(
        jan31_2026,
        1,
        SubscriptionDurationUnit.MONTH,
        jan31_2026,
      );
      expect(result.toISOString()).toBe('2026-02-28T00:00:00.000Z');
    });

    it('rejects non-positive duration', () => {
      expect(() =>
        extendPeriod(null, 0, SubscriptionDurationUnit.DAY, jan31_2026),
      ).toThrow(SubscriptionDomainError);
    });
  });

  describe('assertCanRedeemCoupon', () => {
    it('allows redeem when there is no active period', () => {
      expect(() => assertCanRedeemCoupon(null, jan31_2026)).not.toThrow();
      expect(() =>
        assertCanRedeemCoupon(feb15_2026, mar1_2026),
      ).not.toThrow();
    });

    it('blocks redeem while subscription is active (no stacking)', () => {
      expect(() =>
        assertCanRedeemCoupon(mar1_2026, feb15_2026),
      ).toThrow(SubscriptionDomainError);
      expect(() =>
        assertCanRedeemCoupon(mar1_2026, feb15_2026),
      ).toThrow(/already active until/);
    });
  });

  describe('assertCouponDefinitionValid', () => {
    const baseCoupon = {
      isActive: true,
      validFrom: null,
      validUntil: null,
      maxRedemptions: null,
      redemptionCount: 0,
    };

    it('allows valid active coupon', () => {
      expect(() =>
        assertCouponDefinitionValid(baseCoupon, feb15_2026),
      ).not.toThrow();
    });

    it('rejects inactive coupon', () => {
      expect(() =>
        assertCouponDefinitionValid(
          { ...baseCoupon, isActive: false },
          feb15_2026,
        ),
      ).toThrow(/not active/);
    });

    it('rejects expired coupon', () => {
      expect(() =>
        assertCouponDefinitionValid(
          { ...baseCoupon, validUntil: jan31_2026 },
          mar1_2026,
        ),
      ).toThrow(/expired/);
    });

    it('rejects when redemption limit reached', () => {
      expect(() =>
        assertCouponDefinitionValid(
          { ...baseCoupon, maxRedemptions: 5, redemptionCount: 5 },
          feb15_2026,
        ),
      ).toThrow(/limit reached/);
    });
  });
});
