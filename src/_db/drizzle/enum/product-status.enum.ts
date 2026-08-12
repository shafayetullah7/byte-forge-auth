/**
 * Product Status Enum
 *
 * Tracks publication/moderation state only.
 * Stock availability is tracked on variants via availableQuantity / stockStatus
 * (projection synced from the inventory table).
 */
export const ProductStatusEnum = {
  DRAFT: 'DRAFT', // Not published
  ACTIVE: 'ACTIVE', // Published and visible
  ARCHIVED: 'ARCHIVED', // Soft deleted/hidden by seller
} as const;

export type TProductStatus =
  (typeof ProductStatusEnum)[keyof typeof ProductStatusEnum];
