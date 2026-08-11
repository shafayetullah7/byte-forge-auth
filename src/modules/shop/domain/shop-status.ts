/**
 * Domain shop status values. String values match `ShopStatusEnum` in Drizzle
 * so repositories can map rows without conversion logic beyond casting.
 */
export const ShopStatus = {
  DRAFT: 'DRAFT',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;

export type ShopStatus = (typeof ShopStatus)[keyof typeof ShopStatus];

export const TERMINAL_SHOP_STATUSES: readonly ShopStatus[] = [
  ShopStatus.DELETED,
];

export function isTerminalShopStatus(status: ShopStatus): boolean {
  return TERMINAL_SHOP_STATUSES.includes(status);
}
