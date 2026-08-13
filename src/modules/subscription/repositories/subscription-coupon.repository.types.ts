export type SubscriptionCouponFilters = {
  isActive?: boolean;
  search?: string;
};

export type SubscriptionCouponUpdateInput = Partial<{
  code: string;
  durationValue: number;
  durationUnit: 'DAY' | 'MONTH';
  maxRedemptions: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
}>;
