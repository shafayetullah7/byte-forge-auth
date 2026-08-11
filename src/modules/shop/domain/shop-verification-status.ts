/**
 * Domain verification status values. String values match `ShopVerificationStatusEnum`.
 */
export const ShopVerificationStatus = {
  PENDING: 'PENDING',
  REVIEWING: 'REVIEWING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ShopVerificationStatus =
  (typeof ShopVerificationStatus)[keyof typeof ShopVerificationStatus];
